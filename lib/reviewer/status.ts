import { REVIEWER_FEEDBACK_MAX_LENGTH, type ReviewerDecision } from '@/lib/validation/schemas'

export const REVIEWER_DECISIONS = ['pending', 'accepted', 'declined'] as const

export const REVIEWER_DECISION_SET = new Set<ReviewerDecision>(REVIEWER_DECISIONS)

export const DEFAULT_REVIEWER_DECISION: ReviewerDecision = 'pending'

const REVIEWER_DECISION_LABELS: Record<ReviewerDecision, string> = {
	pending: 'Pending',
	accepted: 'Accepted',
	declined: 'Declined'
}

const REVIEWER_DECISION_TONE_CLASSES: Record<ReviewerDecision, string> = {
	pending: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
	accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
	declined: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
}

export { REVIEWER_FEEDBACK_MAX_LENGTH }

export function getReviewerStatusLabel(status: ReviewerDecision): string {
	return REVIEWER_DECISION_LABELS[status]
}

export function getReviewerStatusToneClass(status: ReviewerDecision): string {
	return REVIEWER_DECISION_TONE_CLASSES[status]
}

export function normalizeReviewerDecision(value: unknown): ReviewerDecision {
	if (typeof value === 'string' && REVIEWER_DECISION_SET.has(value as ReviewerDecision)) {
		return value as ReviewerDecision
	}
	return DEFAULT_REVIEWER_DECISION
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null
}

export function extractReviewerStatuses(raw: unknown): Record<string, ReviewerDecision> {
	if (!isPlainObject(raw)) {
		return {}
	}

	const result: Record<string, ReviewerDecision> = {}
	for (const [key, value] of Object.entries(raw)) {
		if (typeof key === 'string') {
			result[key] = normalizeReviewerDecision(value)
		}
	}
	return result
}

export function extractReviewerFeedback(raw: unknown): Record<string, string> {
	if (!isPlainObject(raw)) {
		return {}
	}

	const result: Record<string, string> = {}
	for (const [key, value] of Object.entries(raw)) {
		if (typeof key !== 'string' || typeof value !== 'string') {
			continue
		}
		const trimmed = value.trim()
		if (trimmed.length === 0) {
			continue
		}
		result[key] =
			trimmed.length > REVIEWER_FEEDBACK_MAX_LENGTH ? trimmed.slice(0, REVIEWER_FEEDBACK_MAX_LENGTH) : trimmed
	}
	return result
}
