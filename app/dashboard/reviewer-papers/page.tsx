'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatFileSize } from '@/lib/papers/constants'
import { getReviewerStatusLabel, getReviewerStatusToneClass, REVIEWER_DECISIONS } from '@/lib/reviewer/status'
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
	reviewers: Array<{ id: string; name: string; status: ReviewerDecision }>
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
		async (paperId: string, status: ReviewerDecision) => {
			if (!user || user.role !== 'reviewer') {
				return false
			}

			setUpdatingStatus((prev) => ({ ...prev, [paperId]: true }))
			setStatusErrors((prev) => ({ ...prev, [paperId]: null }))

			try {
				const response = await fetch('/api/papers', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ paperId, status })
				})

				if (!response.ok) {
					throw new Error('Request failed')
				}

				setAssignments((prev) =>
					prev.map((assignment) =>
						assignment.id === paperId
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
					delete next[paperId]
					return next
				})
				return true
			} catch (requestError) {
				console.error('Failed to update reviewer status:', requestError)
				setStatusErrors((prev) => ({
					...prev,
					[paperId]: 'Failed to save your decision. Please try again.'
				}))
				return false
			} finally {
				setUpdatingStatus((prev) => ({ ...prev, [paperId]: false }))
			}
		},
		[user]
	)

	const handleStartEditing = useCallback((paperId: string, currentStatus: ReviewerDecision) => {
		setEditingPaperId(paperId)
		setDraftStatuses((prev) => ({ ...prev, [paperId]: currentStatus }))
	}, [])

	const handleCancelEditing = useCallback((paperId: string) => {
		setEditingPaperId((prev) => (prev === paperId ? null : prev))
		setDraftStatuses((prev) => {
			const next = { ...prev }
			delete next[paperId]
			return next
		})
	}, [])

	const handleDraftStatusChange = useCallback((paperId: string, status: ReviewerDecision) => {
		setDraftStatuses((prev) => ({ ...prev, [paperId]: status }))
	}, [])

	const handleSaveEditing = useCallback(
		async (paperId: string, status: ReviewerDecision) => {
			const success = await handleStatusChange(paperId, status)
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
								{assignment.file ? (
									<div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
										<span className='font-medium text-foreground'>Manuscript:</span>
										{assignment.file.downloadUrl ? (
											<Button
												variant='outline'
												size='sm'
												asChild
											>
												<a
													href={assignment.file.downloadUrl}
													target='_blank'
													rel='noopener noreferrer'
												>
													Download PDF
												</a>
											</Button>
										) : (
											<span>No download link available.</span>
										)}
										{typeof assignment.file.size === 'number' && assignment.file.size > 0 && (
											<span>{formatFileSize(assignment.file.size)}</span>
										)}
										{assignment.file.uploadedAt && (
											<span>Uploaded {new Date(assignment.file.uploadedAt).toLocaleString()}</span>
										)}
									</div>
								) : (
									<p className='text-sm text-muted-foreground'>No manuscript available yet.</p>
								)}
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
				<PageTitle>Assigned Papers</PageTitle>
				<PageDescription>Keep track of the papers you are expected to review.</PageDescription>
			</header>
			{content}
		</div>
	)
}
