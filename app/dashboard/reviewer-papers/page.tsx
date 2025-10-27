'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { getReviewerStatusLabel, getReviewerStatusToneClass, REVIEWER_DECISIONS } from '@/lib/reviewer-status'
import { type ReviewerDecision } from '@/lib/schemas'

const STATUS_OPTIONS: Array<{ value: ReviewerDecision; label: string }> = REVIEWER_DECISIONS.map((value) => ({
	value,
	label: getReviewerStatusLabel(value)
}))

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
	reviewers: Array<{ id: string; name: string; status: ReviewerDecision }>
}

export default function ReviewerPapersPage() {
	const { user } = useAuth()
	const [assignments, setAssignments] = useState<ReviewerAssignment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [statusErrors, setStatusErrors] = useState<Record<string, string | null>>({})
	const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({})
	const [editingSubmissionId, setEditingSubmissionId] = useState<string | null>(null)
	const [draftStatuses, setDraftStatuses] = useState<Record<string, ReviewerDecision>>({})

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
				const response = await fetch('/api/submissions?scope=reviewer')
				if (!response.ok) {
					throw new Error('Unable to load assigned papers.')
				}
				const payload = (await response.json()) as { submissions: ReviewerAssignment[] }
				setAssignments(payload.submissions)
			} catch (error) {
				console.error('Failed to fetch reviewer assignments:', error)
				setError('Unable to load your assigned papers right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadAssignments()
	}, [user])

	const handleStatusChange = useCallback(
		async (submissionId: string, status: ReviewerDecision) => {
			if (!user || user.role !== 'reviewer') {
				return false
			}

			setUpdatingStatus((prev) => ({ ...prev, [submissionId]: true }))
			setStatusErrors((prev) => ({ ...prev, [submissionId]: null }))

			try {
				const response = await fetch('/api/submissions', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ submissionId, status })
				})

				if (!response.ok) {
					throw new Error('Request failed')
				}

				setAssignments((prev) =>
					prev.map((assignment) =>
						assignment.id === submissionId
							? {
									...assignment,
									status,
									reviewers: assignment.reviewers.map((reviewer) =>
										reviewer.id === user.uid ? { ...reviewer, status } : reviewer
									)
							  }
							: assignment
					)
				)
				setDraftStatuses((prev) => {
					const next = { ...prev }
					delete next[submissionId]
					return next
				})
				return true
			} catch (requestError) {
				console.error('Failed to update reviewer status:', requestError)
				setStatusErrors((prev) => ({
					...prev,
					[submissionId]: 'Failed to save your decision. Please try again.'
				}))
				return false
			} finally {
				setUpdatingStatus((prev) => ({ ...prev, [submissionId]: false }))
			}
		},
		[user]
	)

	const handleStartEditing = useCallback((submissionId: string, currentStatus: ReviewerDecision) => {
		setEditingSubmissionId(submissionId)
		setDraftStatuses((prev) => ({ ...prev, [submissionId]: currentStatus }))
	}, [])

	const handleCancelEditing = useCallback((submissionId: string) => {
		setEditingSubmissionId((prev) => (prev === submissionId ? null : prev))
		setDraftStatuses((prev) => {
			const next = { ...prev }
			delete next[submissionId]
			return next
		})
	}, [])

	const handleDraftStatusChange = useCallback((submissionId: string, status: ReviewerDecision) => {
		setDraftStatuses((prev) => ({ ...prev, [submissionId]: status }))
	}, [])

	const handleSaveEditing = useCallback(
		async (submissionId: string, status: ReviewerDecision) => {
			const success = await handleStatusChange(submissionId, status)
			if (success) {
				setEditingSubmissionId((prev) => (prev === submissionId ? null : prev))
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
					const isEditing = editingSubmissionId === assignment.id
					const draftStatus = draftStatuses[assignment.id]
					const currentStatus = isEditing ? draftStatus ?? assignment.status : assignment.status
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
									{assignment.createdAt && <span>Assigned {new Date(assignment.createdAt).toLocaleString()}</span>}
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4 text-sm text-muted-foreground'>
								<div className='text-sm text-muted-foreground'>
									<strong className='font-medium text-foreground'>Author:</strong> {assignment.author.name}
								</div>
								<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
									<div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3'>
										<span className='text-sm font-medium text-foreground'>Your decision:</span>
										<Select
											value={currentStatus}
											onValueChange={handleSelectChange}
											disabled={!isEditing || isSaving}
										>
											<SelectTrigger size='sm'>
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
									<div className='flex items-center gap-2'>
										{isEditing ? (
											<>
												<Button
													variant='default'
													size='sm'
													onClick={() => void handleSaveEditing(assignment.id, currentStatus)}
													disabled={isSaving}
												>
													{isSaving ? 'Saving...' : 'Save'}
												</Button>
												<Button
													variant='outline'
													size='sm'
													onClick={() => handleCancelEditing(assignment.id)}
													disabled={isSaving}
												>
													Cancel
												</Button>
											</>
										) : (
											<Button
												variant='secondary'
												size='sm'
												onClick={() => handleStartEditing(assignment.id, assignment.status)}
											>
												Edit
											</Button>
										)}
									</div>
								</div>
								{statusError && <p className='text-xs text-destructive'>{statusError}</p>}
								<div className='space-y-2'>
									<strong className='font-medium text-foreground'>All reviewers:</strong>
									<ul className='space-y-1 text-sm'>
										{assignment.reviewers.map((reviewer) => (
											<li
												key={reviewer.id}
												className='flex items-center justify-between gap-2'
											>
												<span>{reviewer.name}</span>
												<span
													className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getReviewerStatusToneClass(
														reviewer.status
													)}`}
												>
													{getReviewerStatusLabel(reviewer.status)}
												</span>
											</li>
										))}
									</ul>
								</div>
								<p>Additional manuscript details will appear here once the upload workflow is implemented.</p>
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
		editingSubmissionId,
		draftStatuses,
		handleStartEditing,
		handleCancelEditing,
		handleDraftStatusChange,
		handleSaveEditing,
		updatingStatus,
		statusErrors
	])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-2xl font-semibold tracking-tight'>Assigned Papers</h1>
				<p className='text-sm text-muted-foreground'>Keep track of the submissions you are expected to review.</p>
			</header>
			{content}
		</div>
	)
}
