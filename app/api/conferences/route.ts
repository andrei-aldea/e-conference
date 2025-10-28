import { NextRequest, NextResponse } from 'next/server'

import { DEFAULT_REVIEWER_DECISION, extractReviewerStatuses } from '@/lib/reviewer/status'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'
import { chunkArray, toIsoString } from '@/lib/server/utils'
import type { ReviewerDecision } from '@/lib/validation/schemas'

export async function GET(request: NextRequest) {
	const scope = request.nextUrl.searchParams.get('scope')

	if (scope !== 'organizer') {
		return NextResponse.json({ error: 'Unsupported scope.' }, { status: 400 })
	}

	try {
		const { firestore, uid } = await authenticateRequest({ allowedRoles: ['organizer'] })

		const reviewersSnapshot = await firestore.collection('users').where('role', '==', 'reviewer').get()

		const reviewerDirectory = reviewersSnapshot.docs.map((doc) => {
			const data = doc.data()
			return {
				id: doc.id,
				name: typeof data?.name === 'string' && data.name.trim().length > 0 ? (data.name as string) : 'Reviewer'
			}
		})

		reviewerDirectory.sort((a, b) => a.name.localeCompare(b.name))

		const reviewerLookup = reviewerDirectory.reduce<Record<string, string>>((acc, reviewer) => {
			acc[reviewer.id] = reviewer.name
			return acc
		}, {})

		const conferencesSnapshot = await firestore.collection('conferences').where('organizerId', '==', uid).get()

		if (conferencesSnapshot.empty) {
			return NextResponse.json({ conferences: [], reviewers: reviewerDirectory })
		}

		const conferences = conferencesSnapshot.docs.map((doc) => {
			const data = doc.data()
			const startDate = toIsoString(data.startDate)
			const endDate = toIsoString(data.endDate)
			return {
				id: doc.id,
				name: data.name as string,
				description: typeof data.description === 'string' ? data.description : '',
				location: typeof data.location === 'string' ? data.location : '',
				startDate: startDate ? new Date(startDate) : null,
				endDate: endDate ? new Date(endDate) : null
			}
		})

		conferences.sort((a, b) => {
			const aTime = a.startDate ? a.startDate.getTime() : 0
			const bTime = b.startDate ? b.startDate.getTime() : 0
			return bTime - aTime
		})

		const conferenceIds = conferences.map((conf) => conf.id)
		const papersByConference: Record<
			string,
			Array<{
				id: string
				title: string
				reviewers: string[]
				reviewerStatuses: Record<string, ReviewerDecision>
				createdAt: string | null
			}>
		> = {}

		if (conferenceIds.length > 0) {
			const chunks = chunkArray(conferenceIds, 10)
			for (const chunk of chunks) {
				const papersSnapshot = await firestore.collection('papers').where('conferenceId', 'in', chunk).get()

				papersSnapshot.forEach((paperDoc) => {
					const data = paperDoc.data()
					const conferenceId = data.conferenceId as string
					if (!conferenceId) {
						return
					}

					const reviewerStatuses = extractReviewerStatuses(data.reviewerStatuses)

					const paperEntry = {
						id: paperDoc.id,
						title: typeof data.title === 'string' ? data.title : 'Untitled paper',
						reviewers: Array.isArray(data.reviewers) ? (data.reviewers as string[]) : [],
						reviewerStatuses,
						createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null
					}

					if (!papersByConference[conferenceId]) {
						papersByConference[conferenceId] = []
					}
					papersByConference[conferenceId].push(paperEntry)
				})
			}
		}

		const conferencesWithDetails = conferences.map((conference) => {
			const papers = papersByConference[conference.id] ?? []
			papers.sort((a, b) => {
				const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
				const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
				return bTime - aTime
			})

			const papersPayload = papers.map((paper) => ({
				id: paper.id,
				title: paper.title,
				createdAt: paper.createdAt,
				reviewers: paper.reviewers.map((reviewerId) => ({
					id: reviewerId,
					name: reviewerLookup[reviewerId] ?? 'Reviewer',
					status: paper.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
				}))
			}))

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

		return NextResponse.json({ conferences: conferencesWithDetails, reviewers: reviewerDirectory })
	} catch (error) {
		return handleApiRouteError(error, 'Failed to list organizer conferences:')
	}
}
