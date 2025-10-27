import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

import { getFirebaseAdminApp } from '@/lib/firebase-admin'
import { DEFAULT_REVIEWER_DECISION, extractReviewerStatuses } from '@/lib/reviewer-status'
import type { ReviewerDecision } from '@/lib/schemas'

function getAuthInstance() {
	return getAuth(getFirebaseAdminApp())
}

function getFirestoreInstance() {
	return getFirestore(getFirebaseAdminApp())
}

function chunkArray<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = []
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size))
	}
	return chunks
}

export async function GET(request: NextRequest) {
	const scope = request.nextUrl.searchParams.get('scope')

	if (scope !== 'organizer') {
		return NextResponse.json({ error: 'Unsupported scope.' }, { status: 400 })
	}

	try {
		const cookieStore = await cookies()
		const sessionCookie = cookieStore.get('session')?.value
		if (!sessionCookie) {
			return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
		}

		const auth = getAuthInstance()
		const decoded = await auth.verifySessionCookie(sessionCookie, true)
		const uid = decoded.uid

		const firestore = getFirestoreInstance()
		const userDoc = await firestore.collection('users').doc(uid).get()
		if (!userDoc.exists) {
			return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
		}

		const userData = userDoc.data()
		if (userData?.role !== 'organizer') {
			return NextResponse.json({ error: 'Only organizers can view their conferences.' }, { status: 403 })
		}

		const conferencesSnapshot = await firestore.collection('conferences').where('organizerId', '==', uid).get()

		if (conferencesSnapshot.empty) {
			return NextResponse.json({ conferences: [] })
		}

		const conferences = conferencesSnapshot.docs.map((doc) => {
			const data = doc.data()
			const startDate = data.startDate?.toDate?.() ?? null
			const endDate = data.endDate?.toDate?.() ?? null
			return {
				id: doc.id,
				name: data.name as string,
				description: typeof data.description === 'string' ? data.description : '',
				location: typeof data.location === 'string' ? data.location : '',
				startDate,
				endDate
			}
		})

		conferences.sort((a, b) => {
			const aTime = a.startDate ? a.startDate.getTime() : 0
			const bTime = b.startDate ? b.startDate.getTime() : 0
			return bTime - aTime
		})

		const conferenceIds = conferences.map((conf) => conf.id)
		const submissionsByConference: Record<
			string,
			Array<{
				id: string
				title: string
				reviewers: string[]
				reviewerStatuses: Record<string, ReviewerDecision>
				createdAt: string | null
			}>
		> = {}
		const reviewerIds = new Set<string>()

		if (conferenceIds.length > 0) {
			const chunks = chunkArray(conferenceIds, 10)
			for (const chunk of chunks) {
				const submissionsSnapshot = await firestore.collection('submissions').where('conferenceId', 'in', chunk).get()

				submissionsSnapshot.forEach((submissionDoc) => {
					const data = submissionDoc.data()
					const conferenceId = data.conferenceId as string
					if (!conferenceId) {
						return
					}

					const reviewerStatuses = extractReviewerStatuses(data.reviewerStatuses)

					const submissionEntry = {
						id: submissionDoc.id,
						title: typeof data.title === 'string' ? data.title : 'Untitled submission',
						reviewers: Array.isArray(data.reviewers) ? (data.reviewers as string[]) : [],
						reviewerStatuses,
						createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null
					}

					if (!submissionsByConference[conferenceId]) {
						submissionsByConference[conferenceId] = []
					}
					submissionsByConference[conferenceId].push(submissionEntry)

					for (const reviewerId of submissionEntry.reviewers) {
						reviewerIds.add(reviewerId)
					}
				})
			}
		}

		let reviewerLookup: Record<string, string> = {}
		if (reviewerIds.size > 0) {
			const reviewerDocs = await firestore.getAll(
				...[...reviewerIds].map((reviewerId) => firestore.collection('users').doc(reviewerId))
			)
			reviewerLookup = reviewerDocs.reduce<Record<string, string>>((acc, snapshot) => {
				if (snapshot.exists) {
					const reviewerData = snapshot.data()
					acc[snapshot.id] = typeof reviewerData?.name === 'string' ? reviewerData.name : 'Reviewer'
				}
				return acc
			}, {})
		}

		const conferencesWithDetails = conferences.map((conference) => {
			const submissions = submissionsByConference[conference.id] ?? []
			submissions.sort((a, b) => {
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
				submissions: submissions.map((submission) => ({
					id: submission.id,
					title: submission.title,
					createdAt: submission.createdAt,
					reviewers: submission.reviewers.map((reviewerId) => ({
						id: reviewerId,
						name: reviewerLookup[reviewerId] ?? 'Reviewer',
						status: submission.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
					}))
				}))
			}
		})

		return NextResponse.json({ conferences: conferencesWithDetails })
	} catch (error) {
		console.error('Failed to list organizer conferences:', error)
		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}
