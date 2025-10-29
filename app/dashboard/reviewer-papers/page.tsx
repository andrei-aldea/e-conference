'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
	getReviewerStatusLabel,
	getReviewerStatusToneClass,
	REVIEWER_DECISIONS,
	REVIEWER_FEEDBACK_MAX_LENGTH
} from '@/lib/reviewer/status'
import type { ReviewerDecision } from '@/lib/validation/schemas'

const STATUS_OPTIONS: Array<{ value: ReviewerDecision; label: string }> = REVIEWER_DECISIONS.map((value) => ({
	value,
	label: getReviewerStatusLabel(value)
}))

interface PaperFileDetails {
	name: string
	size: number | null
	contentType: string | null
	downloadUrl: string | null
	uploadedAt: string | null
}

interface ReviewerAssignment {
	id: string
	title: string
	createdAt: string | null
	author: {
		id: string
		name: string
	}
	conference: {
		id: string
		name: string
	}
	status: ReviewerDecision
	feedback: string | null
	file: PaperFileDetails | null
}

export default function ReviewerPapersPage() {
	const { user } = useAuth()
	const [assignments, setAssignments] = useState<ReviewerAssignment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [statusErrors, setStatusErrors] = useState<Record<string, string | null>>({})
	const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})
	const [editingPaperId, setEditingPaperId] = useState<string | null>(null)
	const [draftStatuses, setDraftStatuses] = useState<Record<string, ReviewerDecision>>({})
	const [draftFeedbacks, setDraftFeedbacks] = useState<Record<string, string>>({})

	useEffect(() => {
		async function loadAssignments() {
			if (!user || user.role !== 'reviewer') {
				setAssignments([])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch('/api/papers?scope=reviewer')
				if (!response.ok) {
					throw new Error('Unable to load assigned papers.')
				}
				const payload = (await response.json()) as { papers: ReviewerAssignment[] }
				setAssignments(payload.papers)
			} catch (loadError) {
				console.error('Failed to fetch reviewer assignments:', loadError)
				setError('Unable to load your assigned papers right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadAssignments()
	}, [user])

	const handleStatusChange = useCallback(
		async (paperId: string, status: ReviewerDecision, feedback: string) => {
			if (!user || user.role !== 'reviewer') {
				return false
			}

			setUpdatingStatus((prev) => ({ ...prev, [paperId]: true }))
			setStatusErrors((prev) => ({ ...prev, [paperId]: null }))

			try {
				const response = await fetch('/api/papers', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ paperId, status, feedback })
				})

				if (!response.ok) {
					let message = 'Failed to save your decision. Please try again.'
					try {
						const payload = (await response.json()) as { error?: string }
						if (typeof payload?.error === 'string' && payload.error.length > 0) {
							message = payload.error
						}
					} catch (parseError) {
						console.error('Failed to parse reviewer status error response:', parseError)
					}
					throw new Error(message)
				}

				const normalizedFeedback = feedback.trim()
				setAssignments((prev) =>
					prev.map((assignment) =>
						assignment.id === paperId
							? {
									...assignment,
									status,
									feedback: normalizedFeedback.length > 0 ? normalizedFeedback : null
							  }
							: assignment
					)
				)
				setDraftStatuses((prev) => {
					const next = { ...prev }
					delete next[paperId]
					return next
				})
				setDraftFeedbacks((prev) => {
					const next = { ...prev }
					delete next[paperId]
					return next
				})
				return true
			} catch (requestError) {
				console.error('Failed to update reviewer status:', requestError)
				setStatusErrors((prev) => ({
					...prev,
					[paperId]:
						requestError instanceof Error ? requestError.message : 'Failed to save your decision. Please try again.'
				}))
				return false
			} finally {
				setUpdatingStatus((prev) => ({ ...prev, [paperId]: false }))
			}
		},
		[user]
	)

	const handleStartEditing = useCallback(
		(paperId: string, currentStatus: ReviewerDecision, currentFeedback: string | null) => {
			setEditingPaperId(paperId)
			setDraftStatuses((prev) => ({ ...prev, [paperId]: currentStatus }))
			setDraftFeedbacks((prev) => ({ ...prev, [paperId]: currentFeedback ?? '' }))
		},
		[]
	)

	const handleCancelEditing = useCallback((paperId: string) => {
		setEditingPaperId((prev) => (prev === paperId ? null : prev))
		setDraftStatuses((prev) => {
			const next = { ...prev }
			delete next[paperId]
			return next
		})
		setDraftFeedbacks((prev) => {
			const next = { ...prev }
			delete next[paperId]
			return next
		})
	}, [])

	const handleDraftStatusChange = useCallback((paperId: string, status: ReviewerDecision) => {
		setDraftStatuses((prev) => ({ ...prev, [paperId]: status }))
	}, [])

	const handleDraftFeedbackChange = useCallback((paperId: string, feedback: string) => {
		setDraftFeedbacks((prev) => ({ ...prev, [paperId]: feedback }))
	}, [])

	const handleSaveEditing = useCallback(
		async (paperId: string, status: ReviewerDecision, feedback: string) => {
			const success = await handleStatusChange(paperId, status, feedback)
			if (success) {
				setEditingPaperId((prev) => (prev === paperId ? null : prev))
			}
		},
		[handleStatusChange]
	)

	const content = useMemo(() => {
		if (!user) {
			return <p>You must be logged in to view your assigned papers.</p>
		}

		if (user.role !== 'reviewer') {
			return <p>Only reviewers can view assigned papers.</p>
		}

		if (isLoading) {
			return (
				<div className='space-y-4'>
					{Array.from({ length: 3 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className='space-y-2'>
								<Skeleton className='h-5 w-48' />
								<Skeleton className='h-4 w-32' />
							</CardHeader>
							<CardContent className='space-y-2'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-3/4' />
							</CardContent>
						</Card>
					))}
				</div>
			)
		}

		if (error) {
			return <p className='text-sm text-destructive'>{error}</p>
		}

		if (assignments.length === 0) {
			return <p>You have not been assigned any papers yet.</p>
		}

		return (
			<div className='space-y-4'>
				{assignments.map((assignment) => {
					const isEditing = editingPaperId === assignment.id
					const draftStatus = draftStatuses[assignment.id]
					const currentStatus = isEditing ? draftStatus ?? assignment.status : assignment.status
					const draftFeedback = draftFeedbacks[assignment.id] ?? ''
					const isSaving = !!updatingStatus[assignment.id]
					const statusError = statusErrors[assignment.id]

					const handleSelectChange = (value: string) => {
						if (!isEditing) {
							return
						}
						handleDraftStatusChange(assignment.id, value as ReviewerDecision)
					}

					return (
						<Card key={assignment.id}>
							<CardHeader>
								<CardTitle>{assignment.title}</CardTitle>
								<CardDescription className='flex flex-col gap-1 text-xs sm:text-sm sm:flex-row sm:items-center sm:justify-between'>
									<span>Conference: {assignment.conference.name}</span>
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4 text-sm text-muted-foreground'>
								<div>
									<strong className='font-medium text-foreground'>Author:</strong> {assignment.author.name}
								</div>
								{assignment.file ? (
									<div className='flex flex-wrap items-center gap-1'>
										<span className='font-medium text-foreground'>File:</span>
										{assignment.file.downloadUrl ? (
											<a
												href={assignment.file.downloadUrl}
												target='_blank'
												className='underline'
												rel='noopener noreferrer'
											>
												View PDF
											</a>
										) : (
											<span>No download link available.</span>
										)}
									</div>
								) : (
									<p>No file available yet.</p>
								)}
								{isEditing ? (
									<form
										onSubmit={(event) => {
											event.preventDefault()
											void handleSaveEditing(assignment.id, currentStatus, draftFeedback)
										}}
										className='space-y-4'
									>
										<div className='space-y-2'>
											<Label htmlFor={`decision-${assignment.id}`}>Decision</Label>
											<Select
												value={currentStatus}
												onValueChange={handleSelectChange}
												disabled={isSaving}
											>
												<SelectTrigger
													size='sm'
													id={`decision-${assignment.id}`}
												>
													<SelectValue />
												</SelectTrigger>
												<SelectContent>
													{STATUS_OPTIONS.map((option) => (
														<SelectItem
															key={option.value}
															value={option.value}
														>
															{option.label}
														</SelectItem>
													))}
												</SelectContent>
											</Select>
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`feedback-${assignment.id}`}>Feedback for the author</Label>
											<Textarea
												id={`feedback-${assignment.id}`}
												value={draftFeedback}
												onChange={(event) => handleDraftFeedbackChange(assignment.id, event.target.value)}
												disabled={isSaving}
												maxLength={REVIEWER_FEEDBACK_MAX_LENGTH}
												className='min-h-[120px]'
												placeholder='Share concise, constructive feedback for the author.'
											/>
											<p className='text-xs text-muted-foreground'>
												{draftFeedback.length}/{REVIEWER_FEEDBACK_MAX_LENGTH} characters
											</p>
										</div>
										<div className='flex flex-wrap items-center gap-2'>
											<Button
												type='submit'
												variant='default'
												size='sm'
												disabled={isSaving}
											>
												{isSaving ? 'Saving...' : 'Save'}
											</Button>
											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={() => handleCancelEditing(assignment.id)}
												disabled={isSaving}
											>
												Cancel
											</Button>
											{statusError && <p className='text-xs text-destructive'>{statusError}</p>}
										</div>
									</form>
								) : (
									<div className='space-y-3'>
										<div className='flex flex-wrap items-center gap-2'>
											<span className='text-sm font-medium text-foreground'>Decision:</span>
											<span
												className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getReviewerStatusToneClass(
													currentStatus
												)}`}
											>
												{getReviewerStatusLabel(currentStatus)}
											</span>
										</div>
										<div className='flex flex-wrap items-center gap-2'>
											<strong className='font-medium text-foreground'>Feedback:</strong>
											{assignment.feedback ? (
												<p className='text-sm text-muted-foreground'>{assignment.feedback}</p>
											) : (
												<p className='text-sm italic text-muted-foreground'>No feedback shared yet.</p>
											)}
										</div>
										<div className='flex items-center gap-2'>
											<Button
												variant='secondary'
												size='sm'
												onClick={() => handleStartEditing(assignment.id, assignment.status, assignment.feedback)}
											>
												Edit
											</Button>
										</div>
									</div>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>
		)
	}, [
		user,
		isLoading,
		error,
		assignments,
		editingPaperId,
		draftStatuses,
		draftFeedbacks,
		handleDraftStatusChange,
		handleDraftFeedbackChange,
		handleSaveEditing,
		updatingStatus,
		statusErrors,
		handleStartEditing,
		handleCancelEditing
	])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<PageTitle>Assigned Papers</PageTitle>
				<PageDescription>Keep track of the papers you are expected to review.</PageDescription>
			</header>
			{content}
		</div>
	)
}
