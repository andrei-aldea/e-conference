import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore, Timestamp, type DocumentData, type Firestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'

import { getFirebaseAdminApp } from '@/lib/firebase-admin'
import { DEFAULT_REVIEWER_DECISION, extractReviewerStatuses } from '@/lib/reviewer-status'
import {
	reviewerStatusUpdateSchema,
	submissionFormSchema,
	submissionReviewerAssignmentSchema,
	type ReviewerDecision
} from '@/lib/schemas'

function getFirestoreInstance() {
	return getFirestore(getFirebaseAdminApp())
}

function getAuthInstance() {
	return getAuth(getFirebaseAdminApp())
}

async function fetchDocumentsByIds(
	firestore: Firestore,
	collection: string,
	ids: Set<string>
): Promise<Record<string, DocumentData>> {
	if (ids.size === 0) {
		return {}
	}

	const snapshots = await Promise.all([...ids].map((id) => firestore.collection(collection).doc(id).get()))

	const lookup: Record<string, DocumentData> = {}
	for (const snapshot of snapshots) {
		if (snapshot.exists) {
			lookup[snapshot.id] = snapshot.data() as DocumentData
		}
	}

	return lookup
}

export async function GET(request: NextRequest) {
	try {
		const scope = request.nextUrl.searchParams.get('scope') ?? 'author'

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

		if (scope === 'reviewer') {
			if (userData?.role !== 'reviewer') {
				return NextResponse.json({ error: 'Only reviewers can load assigned papers.' }, { status: 403 })
			}

			const submissionsSnapshot = await firestore
				.collection('submissions')
				.where('reviewers', 'array-contains', uid)
				.get()

			const authorIds = new Set<string>()
			const conferenceIds = new Set<string>()
			const reviewerIds = new Set<string>()
			const submissions = submissionsSnapshot.docs.map((doc) => {
				const data = doc.data() as DocumentData
				const authorId = typeof data.authorId === 'string' ? data.authorId : null
				const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
				const reviewerAssignments = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
				const reviewerStatuses = extractReviewerStatuses(data.reviewerStatuses)
				if (authorId) {
					authorIds.add(authorId)
				}
				if (conferenceId) {
					conferenceIds.add(conferenceId)
				}
				for (const reviewerId of reviewerAssignments) {
					reviewerIds.add(reviewerId)
				}
				return {
					id: doc.id,
					title: typeof data.title === 'string' ? (data.title as string) : 'Untitled submission',
					authorId,
					conferenceId,
					reviewerIds: reviewerAssignments,
					reviewerStatuses,
					status: reviewerStatuses[uid] ?? DEFAULT_REVIEWER_DECISION,
					createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null
				}
			})

			const [authorLookup, conferenceLookup, reviewerLookup] = await Promise.all([
				fetchDocumentsByIds(firestore, 'users', authorIds),
				fetchDocumentsByIds(firestore, 'conferences', conferenceIds),
				fetchDocumentsByIds(firestore, 'users', reviewerIds)
			])

			submissions.sort((a, b) => {
				const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
				const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
				return bDate - aDate
			})

			const submissionsForReviewer = submissions.map((submission) => ({
				id: submission.id,
				title: submission.title,
				author: submission.authorId
					? {
							id: submission.authorId,
							name:
								typeof authorLookup[submission.authorId]?.name === 'string'
									? (authorLookup[submission.authorId]?.name as string)
									: 'Author'
					  }
					: { id: 'unknown', name: 'Author' },
				conference: submission.conferenceId
					? {
							id: submission.conferenceId,
							name:
								typeof conferenceLookup[submission.conferenceId]?.name === 'string'
									? (conferenceLookup[submission.conferenceId]?.name as string)
									: 'Conference'
					  }
					: { id: 'unknown', name: 'Conference' },
				status: submission.status,
				reviewers: submission.reviewerIds.map((reviewerId) => ({
					id: reviewerId,
					name:
						typeof reviewerLookup[reviewerId]?.name === 'string'
							? (reviewerLookup[reviewerId]?.name as string)
							: 'Reviewer',
					status: submission.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
				})),
				createdAt: submission.createdAt
			}))

			return NextResponse.json({ submissions: submissionsForReviewer })
		}

		if (userData?.role !== 'author') {
			return NextResponse.json({ error: 'Only authors can view submissions.' }, { status: 403 })
		}

		const submissionsSnapshot = await firestore.collection('submissions').where('authorId', '==', uid).get()

		const reviewerIds = new Set<string>()
		const conferenceIds = new Set<string>()
		const submissions = submissionsSnapshot.docs.map((doc) => {
			const data = doc.data() as DocumentData
			const reviewers = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
			const reviewerStatuses = extractReviewerStatuses(data.reviewerStatuses)
			for (const reviewerId of reviewers) {
				reviewerIds.add(reviewerId)
			}
			const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
			if (conferenceId) {
				conferenceIds.add(conferenceId)
			}
			return {
				id: doc.id,
				title: typeof data.title === 'string' ? (data.title as string) : 'Untitled submission',
				reviewers,
				reviewerStatuses,
				conferenceId,
				createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null
			}
		})

		const [reviewerLookup, conferenceLookup] = await Promise.all([
			fetchDocumentsByIds(firestore, 'users', reviewerIds),
			fetchDocumentsByIds(firestore, 'conferences', conferenceIds)
		])

		submissions.sort((a, b) => {
			const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return bDate - aDate
		})

		const submissionsWithDetails = submissions.map((submission) => ({
			id: submission.id,
			title: submission.title,
			conferenceId: submission.conferenceId,
			conference: submission.conferenceId
				? {
						id: submission.conferenceId,
						name:
							typeof conferenceLookup[submission.conferenceId]?.name === 'string'
								? (conferenceLookup[submission.conferenceId]?.name as string)
								: 'Conference'
				  }
				: null,
			reviewers: submission.reviewers.map((reviewerId) => ({
				id: reviewerId,
				name:
					typeof reviewerLookup[reviewerId]?.name === 'string'
						? (reviewerLookup[reviewerId]?.name as string)
						: 'Reviewer',
				status: submission.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			})),
			createdAt: submission.createdAt
		}))

		return NextResponse.json({ submissions: submissionsWithDetails })
	} catch (error) {
		console.error('Failed to list submissions:', error)
		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const payload = await request.json()
		const { title, conferenceId } = submissionFormSchema.parse(payload)

		const cookieStore = await cookies()
		const sessionCookie = cookieStore.get('session')?.value
		if (!sessionCookie) {
			return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
		}

		const auth = getAuthInstance()
		const decoded = await auth.verifySessionCookie(sessionCookie, true)
		const uid = decoded.uid

		const firestore = getFirestoreInstance()
		const userSnapshot = await firestore.collection('users').doc(uid).get()
		if (!userSnapshot.exists) {
			return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
		}

		const userData = userSnapshot.data()
		if (userData?.role !== 'author') {
			return NextResponse.json({ error: 'Only authors can submit papers.' }, { status: 403 })
		}

		const conferenceRef = firestore.collection('conferences').doc(conferenceId)
		const conferenceSnapshot = await conferenceRef.get()
		if (!conferenceSnapshot.exists) {
			return NextResponse.json({ error: 'Selected conference does not exist.' }, { status: 404 })
		}

		const reviewersSnapshot = await firestore.collection('users').where('role', '==', 'reviewer').get()
		const reviewerIds = reviewersSnapshot.docs.map((doc) => doc.id).filter((reviewerId) => reviewerId !== uid)

		if (reviewerIds.length < 2) {
			return NextResponse.json(
				{ error: 'Not enough reviewers available. Please contact an organizer.' },
				{ status: 503 }
			)
		}

		const assignedReviewers = pickRandomSample(reviewerIds, 2)
		const reviewerStatuses = assignedReviewers.reduce<Record<string, ReviewerDecision>>((acc, reviewerId) => {
			acc[reviewerId] = DEFAULT_REVIEWER_DECISION
			return acc
		}, {})

		const submissionRef = await firestore.collection('submissions').add({
			title,
			authorId: uid,
			reviewers: assignedReviewers,
			reviewerStatuses,
			conferenceId,
			createdAt: Timestamp.now()
		})

		try {
			const batch = firestore.batch()
			batch.set(conferenceRef, { papers: FieldValue.arrayUnion(submissionRef.id) }, { merge: true })
			for (const reviewerId of assignedReviewers) {
				const reviewerRef = firestore.collection('users').doc(reviewerId)
				batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(submissionRef.id) }, { merge: true })
			}
			await batch.commit()
		} catch (commitError) {
			await submissionRef.delete()
			throw commitError
		}

		return NextResponse.json({ success: true }, { status: 201 })
	} catch (error) {
		console.error('Failed to submit paper:', error)
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid submission payload.' }, { status: 400 })
		}

		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const rawPayload = await request.json()
		const statusPayload = reviewerStatusUpdateSchema.safeParse(rawPayload)
		const assignmentPayload = submissionReviewerAssignmentSchema.safeParse(rawPayload)

		if (!statusPayload.success && !assignmentPayload.success) {
			return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
		}

		const cookieStore = await cookies()
		const sessionCookie = cookieStore.get('session')?.value
		if (!sessionCookie) {
			return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
		}

		const auth = getAuthInstance()
		const decoded = await auth.verifySessionCookie(sessionCookie, true)
		const uid = decoded.uid

		const firestore = getFirestoreInstance()
		const userSnapshot = await firestore.collection('users').doc(uid).get()
		if (!userSnapshot.exists) {
			return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
		}

		const userData = userSnapshot.data()

		if (statusPayload.success) {
			if (userData?.role !== 'reviewer') {
				return NextResponse.json({ error: 'Only reviewers can update paper statuses.' }, { status: 403 })
			}

			const { submissionId, status } = statusPayload.data
			const submissionRef = firestore.collection('submissions').doc(submissionId)
			const submissionSnapshot = await submissionRef.get()
			if (!submissionSnapshot.exists) {
				return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
			}

			const submissionData = submissionSnapshot.data() as DocumentData
			const assignedReviewers = Array.isArray(submissionData.reviewers) ? (submissionData.reviewers as string[]) : []

			if (!assignedReviewers.includes(uid)) {
				return NextResponse.json({ error: 'You are not assigned to this submission.' }, { status: 403 })
			}

			await submissionRef.set(
				{
					reviewerStatuses: { [uid]: status },
					updatedAt: FieldValue.serverTimestamp()
				},
				{ merge: true }
			)

			return NextResponse.json({ success: true })
		}

		if (!assignmentPayload.success) {
			return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
		}

		if (userData?.role !== 'organizer') {
			return NextResponse.json({ error: 'Only organizers can update reviewer assignments.' }, { status: 403 })
		}

		const { submissionId, reviewerIds } = assignmentPayload.data
		const uniqueReviewerIds = Array.from(new Set<string>(reviewerIds))
		if (uniqueReviewerIds.length === 0) {
			return NextResponse.json({ error: 'At least one reviewer must be selected.' }, { status: 400 })
		}

		const submissionRef = firestore.collection('submissions').doc(submissionId)
		const submissionSnapshot = await submissionRef.get()
		if (!submissionSnapshot.exists) {
			return NextResponse.json({ error: 'Submission not found.' }, { status: 404 })
		}

		const submissionData = submissionSnapshot.data() as DocumentData
		const priorReviewerIds = Array.isArray(submissionData.reviewers) ? (submissionData.reviewers as string[]) : []
		const existingStatuses = extractReviewerStatuses(submissionData.reviewerStatuses)

		const reviewerDocs = await firestore.getAll(
			...uniqueReviewerIds.map((reviewerId) => firestore.collection('users').doc(reviewerId))
		)

		for (const docSnapshot of reviewerDocs) {
			if (!docSnapshot.exists) {
				return NextResponse.json({ error: 'One or more reviewers were not found.' }, { status: 400 })
			}
			const reviewerData = docSnapshot.data()
			if (reviewerData?.role !== 'reviewer') {
				return NextResponse.json({ error: 'Invalid reviewer selection.' }, { status: 400 })
			}
		}

		const updatedStatuses = uniqueReviewerIds.reduce<Record<string, ReviewerDecision>>((acc, reviewerId) => {
			acc[reviewerId] = existingStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			return acc
		}, {})

		const addedReviewerIds = uniqueReviewerIds.filter((reviewerId) => !priorReviewerIds.includes(reviewerId))
		const removedReviewerIds = priorReviewerIds.filter((reviewerId) => !uniqueReviewerIds.includes(reviewerId))

		const batch = firestore.batch()
		batch.set(
			submissionRef,
			{
				reviewers: uniqueReviewerIds,
				reviewerStatuses: updatedStatuses,
				updatedAt: FieldValue.serverTimestamp()
			},
			{ merge: true }
		)

		for (const reviewerId of addedReviewerIds) {
			const reviewerRef = firestore.collection('users').doc(reviewerId)
			batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(submissionId) }, { merge: true })
		}

		for (const reviewerId of removedReviewerIds) {
			const reviewerRef = firestore.collection('users').doc(reviewerId)
			batch.set(reviewerRef, { assignedPapers: FieldValue.arrayRemove(submissionId) }, { merge: true })
		}

		await batch.commit()

		return NextResponse.json({ success: true })
	} catch (error) {
		console.error('Failed to update submission:', error)
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
		}

		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}

function pickRandomSample<T>(items: T[], count: number): T[] {
	const buffer = [...items]
	for (let i = buffer.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[buffer[i], buffer[j]] = [buffer[j], buffer[i]]
	}
	return buffer.slice(0, count)
}
