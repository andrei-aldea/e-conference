import { getAuth } from 'firebase-admin/auth'
import { getFirestore, type DocumentData, type Firestore, type Query as FirestoreQuery } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

import { getFirebaseAdminApp } from '@/lib/firebase-admin'
import { DEFAULT_REVIEWER_DECISION, extractReviewerStatuses } from '@/lib/reviewer-status'
import type { ReviewerDecision, User } from '@/lib/schemas'

const COLLECTIONS = {
	USERS: 'users',
	CONFERENCES: 'conferences',
	PAPERS: 'papers'
} as const

class ApiError extends Error {
	constructor(public readonly status: number, message: string) {
		super(message)
	}
}

type UserRole = User['role']

type StatusTally = Record<ReviewerDecision, number>

interface GeneralStatsPayload {
	totalConferences: number
	totalPapers: number
	totalReviewers: number
	totalAuthors: number
	totalOrganizers: number
	totalUsers: number
}

interface OrganizerStatsPayload {
	role: 'organizer'
	conferenceCount: number
	paperCount: number
	totalReviewAssignments: number
	pendingDecisions: number
	acceptedDecisions: number
	declinedDecisions: number
	uniqueReviewerCount: number
	uniqueAuthorCount: number
	latestConferenceName: string | null
	latestConferenceStart: string | null
	latestPaperTitle: string | null
	latestPaperCreatedAt: string | null
}

interface AuthorStatsPayload {
	role: 'author'
	paperCount: number
	conferenceParticipationCount: number
	uniqueReviewerCount: number
	totalReviewerAssignments: number
	pendingReviews: number
	acceptedReviews: number
	declinedReviews: number
	latestPaperTitle: string | null
	latestPaperCreatedAt: string | null
}

interface ReviewerStatsPayload {
	role: 'reviewer'
	assignedPaperCount: number
	pendingReviews: number
	acceptedDecisions: number
	declinedDecisions: number
	completedReviews: number
	conferencesCovered: number
	distinctAuthors: number
	latestAssignedPaperTitle: string | null
	latestAssignedPaperAt: string | null
}

type RoleStatsPayload = OrganizerStatsPayload | AuthorStatsPayload | ReviewerStatsPayload

interface DashboardSummaryPayload {
	general: GeneralStatsPayload
	role: RoleStatsPayload
}

interface PaperRecord {
	id: string
	data: DocumentData
}

export async function GET() {
	try {
		const { firestore, uid, role } = await authenticateRequest()

		const [general, roleStats] = await Promise.all([getGeneralStats(firestore), getRoleStats(firestore, uid, role)])

		const payload: DashboardSummaryPayload = {
			general,
			role: roleStats
		}

		return NextResponse.json(payload)
	} catch (error) {
		if (error instanceof ApiError) {
			return NextResponse.json({ error: error.message }, { status: error.status })
		}

		console.error('Failed to load dashboard summary:', error)
		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}

async function authenticateRequest(): Promise<{ firestore: Firestore; uid: string; role: UserRole }> {
	const cookieStore = await cookies()
	const sessionCookie = cookieStore.get('session')?.value

	if (!sessionCookie) {
		throw new ApiError(401, 'Authentication required.')
	}

	const auth = getAuth(getFirebaseAdminApp())
	const decoded = await auth.verifySessionCookie(sessionCookie, true)

	const firestore = getFirestore(getFirebaseAdminApp())
	const userSnapshot = await firestore.collection(COLLECTIONS.USERS).doc(decoded.uid).get()

	if (!userSnapshot.exists) {
		throw new ApiError(404, 'User profile not found.')
	}

	const userData = userSnapshot.data() as DocumentData
	const role = userData?.role

	if (role !== 'organizer' && role !== 'author' && role !== 'reviewer') {
		throw new ApiError(403, 'Unsupported role for dashboard summary.')
	}

	return {
		firestore,
		uid: decoded.uid,
		role
	}
}

async function getGeneralStats(firestore: Firestore): Promise<GeneralStatsPayload> {
	const [totalConferences, totalPapers, totalReviewers, totalAuthors, totalOrganizers] = await Promise.all([
		countQuery(firestore.collection(COLLECTIONS.CONFERENCES)),
		countQuery(firestore.collection(COLLECTIONS.PAPERS)),
		countQuery(firestore.collection(COLLECTIONS.USERS).where('role', '==', 'reviewer')),
		countQuery(firestore.collection(COLLECTIONS.USERS).where('role', '==', 'author')),
		countQuery(firestore.collection(COLLECTIONS.USERS).where('role', '==', 'organizer'))
	])

	return {
		totalConferences,
		totalPapers,
		totalReviewers,
		totalAuthors,
		totalOrganizers,
		totalUsers: totalAuthors + totalReviewers + totalOrganizers
	}
}

async function getRoleStats(firestore: Firestore, uid: string, role: UserRole): Promise<RoleStatsPayload> {
	switch (role) {
		case 'organizer':
			return getOrganizerStats(firestore, uid)
		case 'author':
			return getAuthorStats(firestore, uid)
		case 'reviewer':
			return getReviewerStats(firestore, uid)
		default:
			throw new ApiError(403, 'Unsupported role for dashboard summary.')
	}
}

async function getOrganizerStats(firestore: Firestore, uid: string): Promise<OrganizerStatsPayload> {
	const conferencesSnapshot = await firestore.collection(COLLECTIONS.CONFERENCES).where('organizerId', '==', uid).get()

	const conferenceIds = conferencesSnapshot.docs.map((doc) => doc.id)
	const conferenceCount = conferencesSnapshot.size

	let latestConferenceName: string | null = null
	let latestConferenceStart: string | null = null

	conferencesSnapshot.forEach((doc) => {
		const data = doc.data() as DocumentData
		const start = toIsoString(data.startDate)
		if (!start) {
			return
		}

		if (!latestConferenceStart || start > latestConferenceStart) {
			latestConferenceStart = start
			latestConferenceName = typeof data.name === 'string' ? data.name : 'Conference'
		}
	})

	const papers = await fetchPapersByConferenceIds(firestore, conferenceIds)
	const paperCount = papers.length

	const reviewerIds = new Set<string>()
	const authorIds = new Set<string>()
	const statusTally = createStatusTally()
	let latestPaperTitle: string | null = null
	let latestPaperCreatedAt: string | null = null

	for (const paper of papers) {
		const data = paper.data
		const createdAt = toIsoString(data.createdAt)
		const reviewers = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
		const statuses = extractReviewerStatuses(data.reviewerStatuses)

		if (typeof data.authorId === 'string') {
			authorIds.add(data.authorId)
		}

		if (createdAt && (!latestPaperCreatedAt || createdAt > latestPaperCreatedAt)) {
			latestPaperCreatedAt = createdAt
			latestPaperTitle = typeof data.title === 'string' ? data.title : 'Untitled paper'
		}

		reviewers.forEach((reviewerId) => {
			reviewerIds.add(reviewerId)
			const status = statuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			statusTally[status] += 1
		})
	}

	const totalReviewAssignments = statusTally.pending + statusTally.accepted + statusTally.declined

	return {
		role: 'organizer',
		conferenceCount,
		paperCount,
		totalReviewAssignments,
		pendingDecisions: statusTally.pending,
		acceptedDecisions: statusTally.accepted,
		declinedDecisions: statusTally.declined,
		uniqueReviewerCount: reviewerIds.size,
		uniqueAuthorCount: authorIds.size,
		latestConferenceName,
		latestConferenceStart,
		latestPaperTitle,
		latestPaperCreatedAt
	}
}

async function getAuthorStats(firestore: Firestore, uid: string): Promise<AuthorStatsPayload> {
	const papersSnapshot = await firestore.collection(COLLECTIONS.PAPERS).where('authorId', '==', uid).get()

	const conferenceIds = new Set<string>()
	const reviewerIds = new Set<string>()
	const statusTally = createStatusTally()
	let latestPaperTitle: string | null = null
	let latestPaperCreatedAt: string | null = null

	papersSnapshot.forEach((doc) => {
		const data = doc.data() as DocumentData
		const createdAt = toIsoString(data.createdAt)
		const reviewers = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
		const statuses = extractReviewerStatuses(data.reviewerStatuses)

		if (createdAt && (!latestPaperCreatedAt || createdAt > latestPaperCreatedAt)) {
			latestPaperCreatedAt = createdAt
			latestPaperTitle = typeof data.title === 'string' ? data.title : 'Untitled paper'
		}

		reviewers.forEach((reviewerId) => {
			reviewerIds.add(reviewerId)
			const status = statuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			statusTally[status] += 1
		})

		const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
		if (conferenceId) {
			conferenceIds.add(conferenceId)
		}
	})

	const paperCount = papersSnapshot.size
	const totalReviewerAssignments = statusTally.pending + statusTally.accepted + statusTally.declined

	return {
		role: 'author',
		paperCount,
		conferenceParticipationCount: conferenceIds.size,
		uniqueReviewerCount: reviewerIds.size,
		totalReviewerAssignments,
		pendingReviews: statusTally.pending,
		acceptedReviews: statusTally.accepted,
		declinedReviews: statusTally.declined,
		latestPaperTitle,
		latestPaperCreatedAt
	}
}

async function getReviewerStats(firestore: Firestore, uid: string): Promise<ReviewerStatsPayload> {
	const papersSnapshot = await firestore.collection(COLLECTIONS.PAPERS).where('reviewers', 'array-contains', uid).get()

	const statusTally = createStatusTally()
	const conferenceIds = new Set<string>()
	const authorIds = new Set<string>()
	let latestAssignedPaperTitle: string | null = null
	let latestAssignedPaperAt: string | null = null

	papersSnapshot.forEach((doc) => {
		const data = doc.data() as DocumentData
		const statuses = extractReviewerStatuses(data.reviewerStatuses)
		const reviewerStatus = statuses[uid] ?? DEFAULT_REVIEWER_DECISION
		statusTally[reviewerStatus] += 1

		const createdAt = toIsoString(data.createdAt)
		if (createdAt && (!latestAssignedPaperAt || createdAt > latestAssignedPaperAt)) {
			latestAssignedPaperAt = createdAt
			latestAssignedPaperTitle = typeof data.title === 'string' ? data.title : 'Untitled paper'
		}

		const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
		if (conferenceId) {
			conferenceIds.add(conferenceId)
		}

		const authorId = typeof data.authorId === 'string' ? data.authorId : null
		if (authorId) {
			authorIds.add(authorId)
		}
	})

	const assignedPaperCount = papersSnapshot.size
	const completedReviews = statusTally.accepted + statusTally.declined

	return {
		role: 'reviewer',
		assignedPaperCount,
		pendingReviews: statusTally.pending,
		acceptedDecisions: statusTally.accepted,
		declinedDecisions: statusTally.declined,
		completedReviews,
		conferencesCovered: conferenceIds.size,
		distinctAuthors: authorIds.size,
		latestAssignedPaperTitle,
		latestAssignedPaperAt
	}
}

async function countQuery(query: FirestoreQuery<DocumentData>): Promise<number> {
	const snapshot = await query.count().get()
	return snapshot.data().count
}

async function fetchPapersByConferenceIds(firestore: Firestore, conferenceIds: string[]): Promise<PaperRecord[]> {
	if (conferenceIds.length === 0) {
		return []
	}

	const results: PaperRecord[] = []
	const chunks = chunkArray(conferenceIds, 10)

	for (const chunk of chunks) {
		const snapshot = await firestore.collection(COLLECTIONS.PAPERS).where('conferenceId', 'in', chunk).get()
		snapshot.forEach((doc) => {
			results.push({ id: doc.id, data: doc.data() as DocumentData })
		})
	}

	return results
}

function chunkArray<T>(items: T[], size: number): T[][] {
	const chunks: T[][] = []
	for (let index = 0; index < items.length; index += size) {
		chunks.push(items.slice(index, index + size))
	}
	return chunks
}

function createStatusTally(): StatusTally {
	return {
		pending: 0,
		accepted: 0,
		declined: 0
	}
}

function toIsoString(value: unknown): string | null {
	if (!value) {
		return null
	}

	if (typeof value === 'string') {
		return value
	}

	if (value instanceof Date) {
		return value.toISOString()
	}

	if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
		try {
			return value.toDate().toISOString()
		} catch (error) {
			console.warn('Failed to convert Firestore timestamp to ISO string:', error)
			return null
		}
	}

	return null
}
