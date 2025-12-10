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
	pending: 'bg-primary/10 text-primary',
	accepted: 'bg-primary text-primary-foreground',
	declined: 'bg-destructive/10 text-destructive'
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

export function summarizeReviewerDecisions(statuses: Iterable<ReviewerDecision>): ReviewerDecision {
	const collected = Array.from(statuses)
	if (collected.length === 0) {
		return 'pending'
	}
	if (collected.some((status) => status === 'pending')) {
		return 'pending'
	}
	if (collected.every((status) => status === 'accepted')) {
		return 'accepted'
	}
	if (collected.every((status) => status === 'declined')) {
		return 'declined'
	}
	return 'pending'
}
