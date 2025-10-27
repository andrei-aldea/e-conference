import type { ReviewerDecision } from '@/lib/validation/schemas'

export type DashboardRole = 'organizer' | 'author' | 'reviewer'

export interface DashboardGeneralStats {
	totalConferences: number
	totalPapers: number
	totalReviewers: number
	totalAuthors: number
	totalOrganizers: number
	totalUsers: number
}

export interface OrganizerDashboardStats {
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

export interface AuthorDashboardStats {
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

export interface ReviewerDashboardStats {
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

export type DashboardRoleStats = OrganizerDashboardStats | AuthorDashboardStats | ReviewerDashboardStats

export type DashboardRoleMap = {
	organizer: OrganizerDashboardStats
	author: AuthorDashboardStats
	reviewer: ReviewerDashboardStats
}

export interface DashboardSummaryResponse {
	general: DashboardGeneralStats
	role: DashboardRoleStats | null
}

export type ReviewerStatusTally = Record<ReviewerDecision, number>
