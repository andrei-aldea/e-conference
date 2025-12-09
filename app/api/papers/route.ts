import { del, put } from '@vercel/blob'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { prisma } from '@/lib/db'
import {
	isAllowedManuscriptExtension,
	isAllowedManuscriptMimeType,
	MANUSCRIPT_MAX_SIZE_BYTES,
	MANUSCRIPT_MAX_SIZE_LABEL
} from '@/lib/papers/constants'
import { DEFAULT_REVIEWER_DECISION, REVIEWER_FEEDBACK_MAX_LENGTH } from '@/lib/reviewer/status'
import { ApiError } from '@/lib/server/api-error'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'
import {
	paperAuthorUpdateSchema,
	paperFormSchema,
	paperReviewerAssignmentSchema,
	reviewerStatusUpdateSchema
} from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
	try {
		const scope = request.nextUrl.searchParams.get('scope') ?? 'author'
		const { uid, role } = await authenticateRequest()

		if (scope === 'reviewer') {
			if (role !== 'reviewer') {
				throw new ApiError(403, 'Only reviewers can load assigned papers.')
			}

			// Find reviews assigned to this user
			const reviews = await prisma.review.findMany({
				where: { reviewerId: uid },
				include: {
					paper: {
						include: {
							author: true,
							conference: true
						}
					}
				},
				orderBy: {
					paper: { createdAt: 'desc' }
				}
			})

			const payload = reviews.map((review) => ({
				id: review.paper.id,
				title: review.paper.title,
				author: {
					id: review.paper.author.id,
					name: review.paper.author.name ?? 'Author'
				},
				conference: {
					id: review.paper.conference.id,
					name: review.paper.conference.name
				},
				status: review.status ?? DEFAULT_REVIEWER_DECISION,
				feedback: review.feedback,
				createdAt: review.paper.createdAt.toISOString(),
				file: {
					name: 'manuscript.pdf',
					downloadUrl: review.paper.fileUrl,
					uploadedAt: review.paper.updatedAt.toISOString()
				}
			}))

			return NextResponse.json({ papers: payload })
		}

		if (role !== 'author') {
			throw new ApiError(403, 'Only authors can view submitted papers.')
		}

		const papers = await prisma.paper.findMany({
			where: { authorId: uid },
			orderBy: { createdAt: 'desc' },
			include: {
				conference: true,
				reviews: {
					include: {
						reviewer: true
					}
				}
			}
		})

		const payload = papers.map((paper) => ({
			id: paper.id,
			title: paper.title,
			conferenceId: paper.conferenceId,
			conference: {
				id: paper.conference.id,
				name: paper.conference.name
			},
			reviewers: paper.reviews.map((review) => ({
				id: review.reviewerId,
				name: review.reviewer.name ?? 'Reviewer',
				status: review.status ?? DEFAULT_REVIEWER_DECISION,
				feedback: review.feedback ?? null
			})),
			createdAt: paper.createdAt.toISOString(),
			file: {
				name: 'manuscript.pdf',
				downloadUrl: paper.fileUrl,
				uploadedAt: paper.updatedAt.toISOString()
			}
		}))

		return NextResponse.json({ papers: payload })
	} catch (error) {
		return handleApiRouteError(error, 'Failed to list papers:')
	}
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const rawTitle = formData.get('title')
		const rawConferenceId = formData.get('conferenceId')
		const fileEntry = formData.get('file')

		const parsed = paperFormSchema.safeParse({
			title: typeof rawTitle === 'string' ? rawTitle : '',
			conferenceId: typeof rawConferenceId === 'string' ? rawConferenceId : ''
		})

		if (!parsed.success) {
			throw new ApiError(400, 'Invalid paper payload.')
		}

		if (!(fileEntry instanceof File)) {
			throw new ApiError(400, 'A PDF manuscript is required.')
		}

		if (fileEntry.size === 0) {
			throw new ApiError(400, 'The uploaded manuscript is empty.')
		}

		const mimeType = fileEntry.type ?? ''
		const mimeAllowed = isAllowedManuscriptMimeType(mimeType)
		const extensionAllowed = isAllowedManuscriptExtension(fileEntry.name)

		if (!mimeAllowed && !extensionAllowed) {
			throw new ApiError(400, 'Only PDF manuscripts are supported at this time.')
		}

		if (fileEntry.size > MANUSCRIPT_MAX_SIZE_BYTES) {
			throw new ApiError(413, `The manuscript exceeds the ${MANUSCRIPT_MAX_SIZE_LABEL} size limit.`)
		}

		const { title, conferenceId } = parsed.data
		const { uid, role } = await authenticateRequest()

		if (role !== 'author') {
			throw new ApiError(403, 'Only authors can submit papers.')
		}

		const conference = await prisma.conference.findUnique({ where: { id: conferenceId } })
		if (!conference) {
			throw new ApiError(404, 'Selected conference does not exist.')
		}

		// Randomly assign 2 reviewers
		// In a real app we might want more complex logic, but here we pick random
		const reviewers = await prisma.user.findMany({ where: { role: 'reviewer' } })

		const reviewerIds = reviewers.map((r) => r.id).filter((id) => id !== uid)
		if (reviewerIds.length < 2) {
			throw new ApiError(503, 'Not enough reviewers available. Please contact an organizer.')
		}

		// Simple shuffle
		const shuffled = reviewerIds.sort(() => 0.5 - Math.random())
		const assignedReviewerIds = shuffled.slice(0, 2)

		// Upload to Blob
		const blob = await put(fileEntry.name, fileEntry, {
			access: 'public'
		})

		try {
			await prisma.paper.create({
				data: {
					title,
					authorId: uid,
					conferenceId,
					fileUrl: blob.url,
					reviews: {
						create: assignedReviewerIds.map((reviewerId) => ({
							reviewerId,
							status: 'pending'
						}))
					}
				}
			})
		} catch (error) {
			// Cleanup blob if DB fails
			await del(blob.url)
			throw error
		}

		return NextResponse.json({ success: true }, { status: 201 })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid paper payload.' }, { status: 400 })
		}

		return handleApiRouteError(error, 'Failed to submit paper:')
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const rawPayload = await request.json()
		const statusPayload = reviewerStatusUpdateSchema.safeParse(rawPayload)
		const assignmentPayload = paperReviewerAssignmentSchema.safeParse(rawPayload)
		const { uid, role } = await authenticateRequest()

		if (!statusPayload.success && !assignmentPayload.success) {
			throw new ApiError(400, 'Invalid update payload.')
		}

		if (statusPayload.success) {
			if (role !== 'reviewer') {
				throw new ApiError(403, 'Only reviewers can edit paper statuses.')
			}

			const { paperId, status, feedback } = statusPayload.data

			// Verify assignment
			const review = await prisma.review.findFirst({
				where: {
					paperId,
					reviewerId: uid
				}
			})

			if (!review) {
				throw new ApiError(403, 'You are not assigned to this paper.')
			}

			const sanitizedFeedback = typeof feedback === 'string' ? feedback.trim() : undefined
			const normalizedFeedback =
				sanitizedFeedback && sanitizedFeedback.length > REVIEWER_FEEDBACK_MAX_LENGTH
					? sanitizedFeedback.slice(0, REVIEWER_FEEDBACK_MAX_LENGTH)
					: sanitizedFeedback

			await prisma.review.updateMany({
				where: {
					paperId,
					reviewerId: uid
				},
				data: {
					status,
					feedback: normalizedFeedback
				}
			})

			return NextResponse.json({ success: true })
		}

		if (role !== 'organizer') {
			throw new ApiError(403, 'Only organizers can update reviewer assignments.')
		}

		if (!assignmentPayload.success) {
			throw new ApiError(400, 'Invalid update payload.')
		}

		const { paperId, reviewerIds } = assignmentPayload.data
		const uniqueReviewerIds = Array.from(new Set<string>(reviewerIds))

		if (uniqueReviewerIds.length === 0) {
			throw new ApiError(400, 'At least one reviewer must be selected.')
		}

		const paper = await prisma.paper.findUnique({
			where: { id: paperId },
			include: { reviews: true }
		})
		if (!paper) {
			throw new ApiError(404, 'Paper not found.')
		}

		const reviewers = await prisma.user.findMany({
			where: {
				id: { in: uniqueReviewerIds },
				role: 'reviewer'
			}
		})

		if (reviewers.length !== uniqueReviewerIds.length) {
			throw new ApiError(400, 'One or more invalid reviewers verified.')
		}

		await prisma.$transaction(async (tx) => {
			await tx.review.deleteMany({
				where: {
					paperId,
					reviewerId: { notIn: uniqueReviewerIds }
				}
			})

			const existingReviewerIds = paper.reviews.map((r) => r.reviewerId)
			const newReviewerIds = uniqueReviewerIds.filter((id) => !existingReviewerIds.includes(id))

			if (newReviewerIds.length > 0) {
				await tx.review.createMany({
					data: newReviewerIds.map((reviewerId) => ({
						paperId,
						reviewerId,
						status: 'pending'
					}))
				})
			}
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
		}

		return handleApiRouteError(error, 'Failed to edit paper:')
	}
}

export async function PUT(request: NextRequest) {
	try {
		const formData = await request.formData()
		const rawPaperId = formData.get('paperId')
		const rawTitle = formData.get('title')
		const fileEntry = formData.get('file')

		if (fileEntry !== null && !(fileEntry instanceof File)) {
			throw new ApiError(400, 'Invalid manuscript upload.')
		}

		const parsed = paperAuthorUpdateSchema.safeParse({
			paperId: typeof rawPaperId === 'string' ? rawPaperId : '',
			title: typeof rawTitle === 'string' && rawTitle.trim().length > 0 ? rawTitle.trim() : undefined
		})

		if (!parsed.success) {
			throw new ApiError(400, 'Invalid paper update payload.')
		}

		const hasNewFile = fileEntry instanceof File
		const { paperId, title } = parsed.data

		if (!hasNewFile && !title) {
			throw new ApiError(400, 'Provide a new title or manuscript to update the paper.')
		}

		const { uid, role } = await authenticateRequest()

		if (role !== 'author') {
			throw new ApiError(403, 'Only authors can edit papers.')
		}

		const paper = await prisma.paper.findUnique({ where: { id: paperId } })
		if (!paper) {
			throw new ApiError(404, 'Paper not found.')
		}

		if (paper.authorId !== uid) {
			throw new ApiError(403, 'You can only update your own papers.')
		}

		let newFileUrl: string | undefined

		if (hasNewFile && fileEntry) {
			if (fileEntry.size === 0) {
				throw new ApiError(400, 'The uploaded manuscript is empty.')
			}

			if (fileEntry.size > MANUSCRIPT_MAX_SIZE_BYTES) {
				throw new ApiError(413, `The manuscript exceeds the ${MANUSCRIPT_MAX_SIZE_LABEL} size limit.`)
			}

			// Upload new file
			const blob = await put(fileEntry.name, fileEntry, { access: 'public' })
			newFileUrl = blob.url

			// Delete old file
			if (paper.fileUrl) {
				// Fire and forget delete or await?
				// await del(paper.fileUrl) // If fails, not critical
				// better to not block response?
				del(paper.fileUrl).catch(console.error)
			}
		}

		await prisma.paper.update({
			where: { id: paperId },
			data: {
				title: title ?? undefined,
				fileUrl: newFileUrl ?? undefined,
				updatedAt: new Date()
			}
		})

		return NextResponse.json({ success: true })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid paper update payload.' }, { status: 400 })
		}

		return handleApiRouteError(error, 'Failed to edit paper:')
	}
}
