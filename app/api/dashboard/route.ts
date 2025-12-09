import { NextResponse } from 'next/server'

import type {
	AuthorDashboardStats,
	DashboardGeneralStats,
	DashboardRole,
	DashboardRoleStats,
	DashboardSummaryResponse,
	OrganizerDashboardStats,
	ReviewerDashboardStats
} from '@/lib/dashboard/summary'
import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'

export async function GET() {
	try {
		const { uid, role } = await authenticateRequest()

		const [general, roleStats] = await Promise.all([getGeneralStats(), getRoleStats(uid, role)])

		const payload: DashboardSummaryResponse = {
			general,
			role: roleStats
		}

		return NextResponse.json(payload)
	} catch (error) {
		return handleApiRouteError(error, 'Failed to load dashboard summary:')
	}
}

async function getGeneralStats(): Promise<DashboardGeneralStats> {
	const [totalConferences, totalPapers, totalReviewers, totalAuthors, totalOrganizers] = await Promise.all([
		prisma.conference.count(),
		prisma.paper.count(),
		prisma.user.count({ where: { role: 'reviewer' } }),
		prisma.user.count({ where: { role: 'author' } }),
		prisma.user.count({ where: { role: 'organizer' } })
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

async function getRoleStats(uid: string, role: DashboardRole): Promise<DashboardRoleStats> {
	switch (role) {
		case 'organizer':
			return getOrganizerStats(uid)
		case 'author':
			return getAuthorStats(uid)
		case 'reviewer':
			return getReviewerStats(uid)
		default:
			// Should not be reachable if authenticateRequest checks role properly, but safe fallback
			throw new Error('Unsupported role')
	}
}

async function getOrganizerStats(uid: string): Promise<OrganizerDashboardStats> {
	// Organizer's conferences
	const conferences = await prisma.conference.findMany({
		where: { organizerId: uid },
		orderBy: { startDate: 'desc' },
		include: {
			papers: {
				include: {
					reviews: true,
					author: true
				}
			}
		}
	})

	const conferenceCount = conferences.length
	const latestConference = conferences[0]

	let paperCount = 0
	let latestPaper: { title: string; createdAt: Date } | null = null
	const reviewerIds = new Set<string>()
	const authorIds = new Set<string>()

	let pending = 0
	let accepted = 0
	let declined = 0

	for (const conf of conferences) {
		paperCount += conf.papers.length
		for (const paper of conf.papers) {
			authorIds.add(paper.authorId)

			if (!latestPaper || paper.createdAt > latestPaper.createdAt) {
				latestPaper = paper
			}

			for (const review of paper.reviews) {
				reviewerIds.add(review.reviewerId)
				if (review.status === 'accepted') accepted++
				else if (review.status === 'declined') declined++
				else pending++ // default or 'pending'
			}
		}
	}

	return {
		role: 'organizer',
		conferenceCount,
		paperCount,
		totalReviewAssignments: pending + accepted + declined,
		pendingDecisions: pending,
		acceptedDecisions: accepted,
		declinedDecisions: declined,
		uniqueReviewerCount: reviewerIds.size,
		uniqueAuthorCount: authorIds.size,
		latestConferenceName: latestConference?.name ?? null,
		latestConferenceStart: latestConference?.startDate?.toISOString() ?? null,
		latestPaperTitle: latestPaper?.title ?? null,
		latestPaperCreatedAt: latestPaper?.createdAt.toISOString() ?? null
	}
}

async function getAuthorStats(uid: string): Promise<AuthorDashboardStats> {
	const papers = await prisma.paper.findMany({
		where: { authorId: uid },
		orderBy: { createdAt: 'desc' },
		include: {
			reviews: true
		}
	})

	const conferenceIds = new Set<string>(papers.map((p) => p.conferenceId))
	const reviewerIds = new Set<string>()

	let pending = 0
	let accepted = 0
	let declined = 0

	for (const paper of papers) {
		for (const review of paper.reviews) {
			reviewerIds.add(review.reviewerId)
			if (review.status === 'accepted') accepted++
			else if (review.status === 'declined') declined++
			else pending++
		}
	}

	return {
		role: 'author',
		paperCount: papers.length,
		conferenceParticipationCount: conferenceIds.size,
		uniqueReviewerCount: reviewerIds.size,
		totalReviewerAssignments: pending + accepted + declined,
		pendingReviews: pending,
		acceptedReviews: accepted,
		declinedReviews: declined,
		latestPaperTitle: papers[0]?.title ?? null,
		latestPaperCreatedAt: papers[0]?.createdAt.toISOString() ?? null
	}
}

async function getReviewerStats(uid: string): Promise<ReviewerDashboardStats> {
	const reviews = await prisma.review.findMany({
		where: { reviewerId: uid },
		include: {
			paper: true
		}
	})

	const papers = reviews.map((r) => r.paper).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

	let pending = 0
	let accepted = 0
	let declined = 0

	const conferenceIds = new Set<string>()
	const authorIds = new Set<string>()

	for (const review of reviews) {
		if (review.status === 'accepted') accepted++
		else if (review.status === 'declined') declined++
		else pending++

		conferenceIds.add(review.paper.conferenceId)
		authorIds.add(review.paper.authorId)
	}

	return {
		role: 'reviewer',
		assignedPaperCount: reviews.length,
		pendingReviews: pending,
		acceptedDecisions: accepted,
		declinedDecisions: declined,
		completedReviews: accepted + declined,
		conferencesCovered: conferenceIds.size,
		distinctAuthors: authorIds.size,
		latestAssignedPaperTitle: papers[0]?.title ?? null,
		latestAssignedPaperAt: papers[0]?.createdAt.toISOString() ?? null
	}
}
