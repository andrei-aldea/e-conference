import { getAuth } from 'firebase-admin/auth'
import { FieldValue, Timestamp, getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { ZodError } from 'zod'

import { getFirebaseAdminApp } from '@/lib/firebase-admin'
import { DEFAULT_REVIEWER_DECISION, extractReviewerStatuses } from '@/lib/reviewer-status'
import {
	paperFormSchema,
	paperReviewerAssignmentSchema,
	reviewerStatusUpdateSchema,
	type ReviewerDecision
} from '@/lib/schemas'

const COLLECTIONS = {
	PAPERS: 'papers',
	USERS: 'users',
	CONFERENCES: 'conferences'
} as const

class ApiError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message)
	}
}

function getFirestoreInstance() {
	return getFirestore(getFirebaseAdminApp())
}

function getAuthInstance() {
	return getAuth(getFirebaseAdminApp())
}

async function authenticateRequest(): Promise<{
	firestore: Firestore
	uid: string
	user: DocumentData
}> {
	const cookieStore = await cookies()
	const sessionCookie = cookieStore.get('session')?.value

	if (!sessionCookie) {
		throw new ApiError(401, 'Authentication required.')
	}

	const auth = getAuthInstance()
	const decoded = await auth.verifySessionCookie(sessionCookie, true)
	const firestore = getFirestoreInstance()
	const userDoc = await firestore.collection(COLLECTIONS.USERS).doc(decoded.uid).get()

	if (!userDoc.exists) {
		throw new ApiError(404, 'User profile not found.')
	}

	return {
		firestore,
		uid: decoded.uid,
		user: userDoc.data() as DocumentData
	}
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
	return snapshots.reduce<Record<string, DocumentData>>((acc, snapshot) => {
		if (snapshot.exists) {
			acc[snapshot.id] = snapshot.data() as DocumentData
		}
		return acc
	}, {})
}

function handleError(error: unknown, logMessage: string) {
	if (error instanceof ApiError) {
		return NextResponse.json({ error: error.message }, { status: error.status })
	}

	console.error(logMessage, error)
	return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
}

function toIsoString(value: unknown): string | null {
	return typeof value === 'object' && value !== null && 'toDate' in value
		? (value as Timestamp).toDate().toISOString()
		: null
}

export async function GET(request: NextRequest) {
	try {
		const scope = request.nextUrl.searchParams.get('scope') ?? 'author'
		const { firestore, uid, user } = await authenticateRequest()

		if (scope === 'reviewer') {
			if (user?.role !== 'reviewer') {
				throw new ApiError(403, 'Only reviewers can load assigned papers.')
			}

			const snapshot = await firestore.collection(COLLECTIONS.PAPERS).where('reviewers', 'array-contains', uid).get()

			const authorIds = new Set<string>()
			const conferenceIds = new Set<string>()
			const reviewerIds = new Set<string>()
			const papers = snapshot.docs.map((doc) => {
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
				reviewerAssignments.forEach((reviewerId) => reviewerIds.add(reviewerId))

				return {
					id: doc.id,
					title: typeof data.title === 'string' ? (data.title as string) : 'Untitled paper',
					authorId,
					conferenceId,
					reviewerIds: reviewerAssignments,
					reviewerStatuses,
					status: reviewerStatuses[uid] ?? DEFAULT_REVIEWER_DECISION,
					createdAt: toIsoString(data.createdAt)
				}
			})

			const [authorLookup, conferenceLookup, reviewerLookup] = await Promise.all([
				fetchDocumentsByIds(firestore, COLLECTIONS.USERS, authorIds),
				fetchDocumentsByIds(firestore, COLLECTIONS.CONFERENCES, conferenceIds),
				fetchDocumentsByIds(firestore, COLLECTIONS.USERS, reviewerIds)
			])

			papers.sort((a, b) => {
				const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
				const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
				return bDate - aDate
			})

			const payload = papers.map((paper) => ({
				id: paper.id,
				title: paper.title,
				author: paper.authorId
					? {
							id: paper.authorId,
							name:
								typeof authorLookup[paper.authorId]?.name === 'string'
									? (authorLookup[paper.authorId]?.name as string)
									: 'Author'
					  }
					: { id: 'unknown', name: 'Author' },
				conference: paper.conferenceId
					? {
							id: paper.conferenceId,
							name:
								typeof conferenceLookup[paper.conferenceId]?.name === 'string'
									? (conferenceLookup[paper.conferenceId]?.name as string)
									: 'Conference'
					  }
					: { id: 'unknown', name: 'Conference' },
				status: paper.status,
				reviewers: paper.reviewerIds.map((reviewerId) => ({
					id: reviewerId,
					name:
						typeof reviewerLookup[reviewerId]?.name === 'string'
							? (reviewerLookup[reviewerId]?.name as string)
							: 'Reviewer',
					status: paper.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
				})),
				createdAt: paper.createdAt
			}))

			return NextResponse.json({ papers: payload })
		}

		if (user?.role !== 'author') {
			throw new ApiError(403, 'Only authors can view submitted papers.')
		}

		const snapshot = await firestore.collection(COLLECTIONS.PAPERS).where('authorId', '==', uid).get()

		const reviewerIds = new Set<string>()
		const conferenceIds = new Set<string>()
		const papers = snapshot.docs.map((doc) => {
			const data = doc.data() as DocumentData
			const reviewers = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
			reviewers.forEach((reviewerId) => reviewerIds.add(reviewerId))

			const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
			if (conferenceId) {
				conferenceIds.add(conferenceId)
			}

			return {
				id: doc.id,
				title: typeof data.title === 'string' ? (data.title as string) : 'Untitled paper',
				reviewers,
				reviewerStatuses: extractReviewerStatuses(data.reviewerStatuses),
				conferenceId,
				createdAt: toIsoString(data.createdAt)
			}
		})

		const [reviewerLookup, conferenceLookup] = await Promise.all([
			fetchDocumentsByIds(firestore, COLLECTIONS.USERS, reviewerIds),
			fetchDocumentsByIds(firestore, COLLECTIONS.CONFERENCES, conferenceIds)
		])

		papers.sort((a, b) => {
			const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return bDate - aDate
		})

		const payload = papers.map((paper) => ({
			id: paper.id,
			title: paper.title,
			conferenceId: paper.conferenceId,
			conference: paper.conferenceId
				? {
						id: paper.conferenceId,
						name:
							typeof conferenceLookup[paper.conferenceId]?.name === 'string'
								? (conferenceLookup[paper.conferenceId]?.name as string)
								: 'Conference'
				  }
				: null,
			reviewers: paper.reviewers.map((reviewerId) => ({
				id: reviewerId,
				name:
					typeof reviewerLookup[reviewerId]?.name === 'string'
						? (reviewerLookup[reviewerId]?.name as string)
						: 'Reviewer',
				status: paper.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			})),
			createdAt: paper.createdAt
		}))

		return NextResponse.json({ papers: payload })
	} catch (error) {
		return handleError(error, 'Failed to list papers:')
	}
}

export async function POST(request: NextRequest) {
	try {
		const payload = await request.json()
		const { title, conferenceId } = paperFormSchema.parse(payload)
		const { firestore, uid, user } = await authenticateRequest()

		if (user?.role !== 'author') {
			throw new ApiError(403, 'Only authors can submit papers.')
		}

		const conferenceRef = firestore.collection(COLLECTIONS.CONFERENCES).doc(conferenceId)
		const conferenceSnapshot = await conferenceRef.get()

		if (!conferenceSnapshot.exists) {
			throw new ApiError(404, 'Selected conference does not exist.')
		}

		const reviewersSnapshot = await firestore.collection(COLLECTIONS.USERS).where('role', '==', 'reviewer').get()
		const reviewerIds = reviewersSnapshot.docs.map((doc) => doc.id).filter((reviewerId) => reviewerId !== uid)

		if (reviewerIds.length < 2) {
			throw new ApiError(503, 'Not enough reviewers available. Please contact an organizer.')
		}

		const assignedReviewerIds = pickRandomSample(reviewerIds, 2)
		const reviewerStatuses = assignedReviewerIds.reduce<Record<string, ReviewerDecision>>((acc, reviewerId) => {
			acc[reviewerId] = DEFAULT_REVIEWER_DECISION
			return acc
		}, {})

		const paperRef = await firestore.collection(COLLECTIONS.PAPERS).add({
			title,
			authorId: uid,
			reviewers: assignedReviewerIds,
			reviewerStatuses,
			conferenceId,
			createdAt: Timestamp.now()
		})

		try {
			const batch = firestore.batch()
			batch.set(conferenceRef, { papers: FieldValue.arrayUnion(paperRef.id) }, { merge: true })
			assignedReviewerIds.forEach((reviewerId) => {
				const reviewerRef = firestore.collection(COLLECTIONS.USERS).doc(reviewerId)
				batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(paperRef.id) }, { merge: true })
			})
			await batch.commit()
		} catch (commitError) {
			await paperRef.delete()
			throw commitError
		}

		return NextResponse.json({ success: true }, { status: 201 })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid paper payload.' }, { status: 400 })
		}

		return handleError(error, 'Failed to submit paper:')
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const rawPayload = await request.json()
		const statusPayload = reviewerStatusUpdateSchema.safeParse(rawPayload)
		const assignmentPayload = paperReviewerAssignmentSchema.safeParse(rawPayload)
		const { firestore, uid, user } = await authenticateRequest()

		if (!statusPayload.success && !assignmentPayload.success) {
			throw new ApiError(400, 'Invalid update payload.')
		}

		if (statusPayload.success) {
			if (user?.role !== 'reviewer') {
				throw new ApiError(403, 'Only reviewers can update paper statuses.')
			}

			const { paperId, status } = statusPayload.data
			const paperRef = firestore.collection(COLLECTIONS.PAPERS).doc(paperId)
			const paperSnapshot = await paperRef.get()

			if (!paperSnapshot.exists) {
				throw new ApiError(404, 'Paper not found.')
			}

			const paperData = paperSnapshot.data() as DocumentData
			const assignedReviewers = Array.isArray(paperData.reviewers) ? (paperData.reviewers as string[]) : []

			if (!assignedReviewers.includes(uid)) {
				throw new ApiError(403, 'You are not assigned to this paper.')
			}

			await paperRef.set(
				{
					reviewerStatuses: { [uid]: status },
					updatedAt: FieldValue.serverTimestamp()
				},
				{ merge: true }
			)

			return NextResponse.json({ success: true })
		}

		if (!assignmentPayload.success) {
			throw new ApiError(400, 'Invalid update payload.')
		}

		if (user?.role !== 'organizer') {
			throw new ApiError(403, 'Only organizers can update reviewer assignments.')
		}

		const { paperId, reviewerIds } = assignmentPayload.data
		const uniqueReviewerIds = Array.from(new Set<string>(reviewerIds))

		if (uniqueReviewerIds.length === 0) {
			throw new ApiError(400, 'At least one reviewer must be selected.')
		}

		const paperRef = firestore.collection(COLLECTIONS.PAPERS).doc(paperId)
		const paperSnapshot = await paperRef.get()

		if (!paperSnapshot.exists) {
			throw new ApiError(404, 'Paper not found.')
		}

		const paperData = paperSnapshot.data() as DocumentData
		const previousReviewerIds = Array.isArray(paperData.reviewers) ? (paperData.reviewers as string[]) : []
		const existingStatuses = extractReviewerStatuses(paperData.reviewerStatuses)

		const reviewerDocs = await firestore.getAll(
			...uniqueReviewerIds.map((reviewerId) => firestore.collection(COLLECTIONS.USERS).doc(reviewerId))
		)

		reviewerDocs.forEach((docSnapshot) => {
			if (!docSnapshot.exists) {
				throw new ApiError(400, 'One or more reviewers were not found.')
			}

			const reviewerData = docSnapshot.data()
			if (reviewerData?.role !== 'reviewer') {
				throw new ApiError(400, 'Invalid reviewer selection.')
			}
		})

		const updatedStatuses = uniqueReviewerIds.reduce<Record<string, ReviewerDecision>>((acc, reviewerId) => {
			acc[reviewerId] = existingStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			return acc
		}, {})

		const addedReviewerIds = uniqueReviewerIds.filter((reviewerId) => !previousReviewerIds.includes(reviewerId))
		const removedReviewerIds = previousReviewerIds.filter((reviewerId) => !uniqueReviewerIds.includes(reviewerId))

		const batch = firestore.batch()
		batch.set(
			paperRef,
			{
				reviewers: uniqueReviewerIds,
				reviewerStatuses: updatedStatuses,
				updatedAt: FieldValue.serverTimestamp()
			},
			{ merge: true }
		)

		addedReviewerIds.forEach((reviewerId) => {
			const reviewerRef = firestore.collection(COLLECTIONS.USERS).doc(reviewerId)
			batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(paperId) }, { merge: true })
		})

		removedReviewerIds.forEach((reviewerId) => {
			const reviewerRef = firestore.collection(COLLECTIONS.USERS).doc(reviewerId)
			batch.set(reviewerRef, { assignedPapers: FieldValue.arrayRemove(paperId) }, { merge: true })
		})

		await batch.commit()

		return NextResponse.json({ success: true })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
		}

		return handleError(error, 'Failed to update paper:')
	}
}

function pickRandomSample<T>(items: T[], count: number): T[] {
	const buffer = [...items]
	for (let index = buffer.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1))
		;[buffer[index], buffer[swapIndex]] = [buffer[swapIndex], buffer[index]]
	}
	return buffer.slice(0, count)
}
