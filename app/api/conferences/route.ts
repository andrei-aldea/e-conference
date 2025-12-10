import { prisma } from '@/lib/db'
import { DEFAULT_REVIEWER_DECISION } from '@/lib/reviewer/status'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'
import { Prisma } from '@prisma/client'
import { unstable_cache } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const getCachedReviewers = unstable_cache(
	async () => {
		return prisma.user.findMany({
			where: { role: 'reviewer' },
			orderBy: { name: 'asc' },
			select: { id: true, name: true }
		})
	},
	['reviewers-list'],
	{ tags: ['reviewers'], revalidate: 3600 }
)

const getCachedOrganizerConferences = unstable_cache(
	async (uid: string) => {
		return prisma.conference.findMany({
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
	},
	['organizer-conferences'],
	{ tags: ['conferences'], revalidate: 60 }
)

const getCachedAllConferences = unstable_cache(
	async () => {
		return prisma.conference.findMany({
			orderBy: { startDate: 'desc' }
		})
	},
	['all-conferences'],
	{ tags: ['conferences'], revalidate: 60 }
)

export async function GET(request: NextRequest) {
	const scope = request.nextUrl.searchParams.get('scope')

	if (scope === 'organizer') {
		try {
			const { uid } = await authenticateRequest({ allowedRoles: ['organizer'] })

			const reviewers = await getCachedReviewers()

			const reviewerLookup = reviewers.reduce(
				(acc: Record<string, string>, r: { id: string; name: string | null }) => {
					acc[r.id] = r.name ?? 'Reviewer'
					return acc
				},
				{} as Record<string, string>
			)

			const conferences = await getCachedOrganizerConferences(uid)

			const conferencesWithDetails = conferences.map(
				(
					conference: Prisma.ConferenceGetPayload<{
						include: {
							papers: {
								include: {
									reviews: true
								}
							}
						}
					}>
				) => {
					const papersPayload = conference.papers.map((paper) => {
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
								name: 'manuscript.pdf',
								downloadUrl: paper.fileUrl,
								uploadedAt: paper.updatedAt ? new Date(paper.updatedAt).toISOString() : null
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
						startDate: conference.startDate ? new Date(conference.startDate).toISOString() : null,
						endDate: conference.endDate ? new Date(conference.endDate).toISOString() : null,
						papers: papersPayload
					}
				}
			)

			return NextResponse.json({ conferences: conferencesWithDetails, reviewers })
		} catch (error) {
			return handleApiRouteError(error, 'Failed to list organizer conferences:')
		}
	}

	// Public/General listing
	try {
		// Authenticate if needed
		await authenticateRequest()

		const conferences = await getCachedAllConferences()

		const payload = conferences.map((c) => ({
			id: c.id,
			name: c.name,
			description: c.description,
			location: c.location,
			startDate: c.startDate ? new Date(c.startDate).toISOString() : null,
			endDate: c.endDate ? new Date(c.endDate).toISOString() : null
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
