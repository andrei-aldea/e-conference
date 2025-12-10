import { prisma } from '@/lib/db'
import { DEFAULT_REVIEWER_DECISION } from '@/lib/reviewer/status'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
	const scope = request.nextUrl.searchParams.get('scope')

	if (scope === 'organizer') {
		try {
			const { prisma, uid } = await authenticateRequest({ allowedRoles: ['organizer'] })

			const reviewers = await prisma.user.findMany({
				where: { role: 'reviewer' },
				orderBy: { name: 'asc' },
				select: { id: true, name: true }
			})

			const reviewerLookup = reviewers.reduce((acc: Record<string, string>, r: { id: string; name: string | null }) => {
				acc[r.id] = r.name ?? 'Reviewer'
				return acc
			}, {} as Record<string, string>)

			const conferences = await prisma.conference.findMany({
				where: { organizerId: uid },
				orderBy: { startDate: 'desc' },
				include: {
					papers: {
						include: {
							reviews: true
						}
					}
				}
			})

			const conferencesWithDetails = conferences.map((conference) => {
				const papersPayload = conference.papers.map((paper) => {
					// Map reviews to reviewerStatuses format if needed for frontend compat
					// Frontend expects: reviewers: { id, name, status }[]
					// In DB, reviews is a table linking paper and reviewer.
					// We need to fetch all reviewers assigned to this paper.
					// In Firestore it was paper.reviewers [id, id] and paper.reviewerStatuses { id: status }

					// In Prisma schema: Paper has reviews `Review[]`.
					// But wait, `Review` model has `reviewerId`.
					// Does Paper have a list of assigned reviewers without a review entry?
					// The schema I defined:
					/* 
                    model Review {
                      id String
                      paperId String
                      reviewerId String
                      status String?
                      feedback String?
                    }
                    */
					// If a reviewer is assigned but hasn't reviewed, is there a Review record?
					// I should assume YES, creating a "pending" review record upon assignment is the best way to track assignment.
					// If the migration logic requires "assigned but no status", I'll assume status='pending'.

					// We need to map reviews to the frontend structure.
					return {
						id: paper.id,
						title: paper.title,
						createdAt: paper.createdAt,
						reviewers: paper.reviews.map((review) => ({
							id: review.reviewerId,
							name: reviewerLookup[review.reviewerId] ?? 'Reviewer',
							status: review.status ?? DEFAULT_REVIEWER_DECISION
						})),
						file: {
							name: 'manuscript.pdf', // Simplified for now as Blob URL doesn't store metadata easily unless we use db
							downloadUrl: paper.fileUrl,
							uploadedAt: paper.updatedAt?.toISOString() // Approximation
						}
					}
				})

				// Sort papers by createdAt desc
				papersPayload.sort((a, b) => {
					const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
					const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
					return bTime - aTime
				})

				return {
					id: conference.id,
					name: conference.name,
					description: conference.description,
					location: conference.location,
					startDate: conference.startDate?.toISOString() ?? null,
					endDate: conference.endDate?.toISOString() ?? null,
					papers: papersPayload
				}
			})

			return NextResponse.json({ conferences: conferencesWithDetails, reviewers })
		} catch (error) {
			return handleApiRouteError(error, 'Failed to list organizer conferences:')
		}
	}

	// Public/General listing
	try {
		// Authenticate if needed
		await authenticateRequest()

		const conferences = await prisma.conference.findMany({
			orderBy: { startDate: 'desc' }
		})

		const payload = conferences.map((c) => ({
			id: c.id,
			name: c.name,
			description: c.description,
			location: c.location,
			startDate: c.startDate.toISOString(),
			endDate: c.endDate.toISOString()
		}))

		return NextResponse.json({ conferences: payload })
	} catch (error) {
		return handleApiRouteError(error, 'Failed to list conferences:')
	}
}

export async function POST(request: NextRequest) {
	try {
		const { prisma, uid } = await authenticateRequest({ allowedRoles: ['organizer'] })

		const json = await request.json()
		const { name, location, description, startDate, endDate } = json

		// Basic validation (using schema would be better, reusing existing zod schema if possible or simple check)
		if (!name || !startDate || !endDate) {
			return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
		}

		const conference = await prisma.conference.create({
			data: {
				name,
				location: location ?? '',
				description: description ?? '',
				startDate: new Date(startDate),
				endDate: new Date(endDate),
				organizerId: uid
			}
		})

		return NextResponse.json({ success: true, id: conference.id }, { status: 201 })
	} catch (error) {
		return handleApiRouteError(error, 'Failed to create conference:')
	}
}
