'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { deleteDoc, doc } from 'firebase/firestore'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/firebase'
import { DEFAULT_REVIEWER_DECISION, getReviewerStatusLabel, getReviewerStatusToneClass } from '@/lib/reviewer-status'
import { type ReviewerDecision } from '@/lib/schemas'

interface ReviewerSummary {
	id: string
	name: string
	status: ReviewerDecision
}

interface ConferenceSubmission {
	id: string
	title: string
	createdAt: string | null
	reviewers: ReviewerSummary[]
}

interface OrganizerConference {
	id: string
	name: string
	description?: string
	location?: string
	startDate: string | null
	endDate: string | null
	submissions: ConferenceSubmission[]
}

interface ReviewerOption {
	id: string
	name: string
}

export default function MyConferencesPage() {
	const { user } = useAuth()
	const [conferences, setConferences] = useState<OrganizerConference[]>([])
	const [reviewers, setReviewers] = useState<ReviewerOption[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)
	const [expandedSubmissionId, setExpandedSubmissionId] = useState<string | null>(null)
	const [savingSubmissionId, setSavingSubmissionId] = useState<string | null>(null)
	const [selectionBySubmission, setSelectionBySubmission] = useState<Record<string, string[]>>({})

	const handleDeleteConference = useCallback(
		(conferenceId: string) => {
			if (!user || user.role !== 'organizer') {
				return
			}

			toast.error('Delete this conference?', {
				description: 'This action cannot be undone.',
				action: {
					label: 'Delete',
					onClick: async () => {
						setDeletingId(conferenceId)
						try {
							await deleteDoc(doc(db, 'conferences', conferenceId))
							setConferences((prev) => prev.filter((conf) => conf.id !== conferenceId))
							toast.success('Conference deleted successfully.')
						} catch (deleteError) {
							console.error('Failed to delete conference:', deleteError)
							toast.error('There was an error deleting the conference.')
						} finally {
							setDeletingId((current) => (current === conferenceId ? null : current))
						}
					}
				}
			})
		},
		[user]
	)

	useEffect(() => {
		async function loadConferences() {
			if (!user || user.role !== 'organizer') {
				setConferences([])
				setReviewers([])
				setSelectionBySubmission({})
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch('/api/conferences?scope=organizer')
				if (!response.ok) {
					throw new Error('Unable to load conferences.')
				}
				const payload = (await response.json()) as {
					conferences: OrganizerConference[]
					reviewers?: ReviewerOption[]
				}
				setConferences(payload.conferences)
				setReviewers(payload.reviewers ?? [])
				setSelectionBySubmission(() => {
					const map: Record<string, string[]> = {}
					for (const conference of payload.conferences) {
						for (const submission of conference.submissions) {
							map[submission.id] = submission.reviewers.map((reviewer) => reviewer.id)
						}
					}
					return map
				})
			} catch (error) {
				console.error('Failed to load organizer conferences:', error)
				setError('Unable to load your conferences right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadConferences()
	}, [user])

	const handleToggleSubmission = useCallback((submissionId: string) => {
		setExpandedSubmissionId((current) => (current === submissionId ? null : submissionId))
	}, [])

	const handleToggleReviewer = useCallback((submissionId: string, reviewerId: string) => {
		setSelectionBySubmission((current) => {
			const existing = current[submissionId] ?? []
			const next = new Set(existing)
			if (next.has(reviewerId)) {
				next.delete(reviewerId)
			} else {
				next.add(reviewerId)
			}
			return {
				...current,
				[submissionId]: Array.from(next)
			}
		})
	}, [])

	const handleResetSelection = useCallback((submissionId: string, baseline: string[]) => {
		setSelectionBySubmission((current) => ({
			...current,
			[submissionId]: baseline
		}))
	}, [])

	const handleSaveAssignments = useCallback(
		async (submission: ConferenceSubmission) => {
			const selectedReviewerIds = selectionBySubmission[submission.id] ?? []
			if (selectedReviewerIds.length === 0) {
				toast.error('Select at least one reviewer before saving.')
				return
			}

			setSavingSubmissionId(submission.id)
			const previousReviewerIds = submission.reviewers.map((reviewer) => reviewer.id)

			try {
				const response = await fetch('/api/submissions', {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ submissionId: submission.id, reviewerIds: selectedReviewerIds })
				})

				if (!response.ok) {
					throw new Error('Request failed')
				}

				setConferences((current) =>
					current.map((conference) => ({
						...conference,
						submissions: conference.submissions.map((entry) => {
							if (entry.id !== submission.id) {
								return entry
							}

							const nextReviewers = selectedReviewerIds.map((reviewerId) => {
								const existingReviewer = entry.reviewers.find((item) => item.id === reviewerId)
								if (existingReviewer) {
									return existingReviewer
								}

								const fallbackName = reviewers.find((option) => option.id === reviewerId)?.name ?? 'Reviewer'
								return {
									id: reviewerId,
									name: fallbackName,
									status: DEFAULT_REVIEWER_DECISION
								}
							})

							return {
								...entry,
								reviewers: nextReviewers
							}
						})
					}))
				)

				toast.success('Reviewer assignments updated successfully.')
			} catch (error) {
				console.error('Failed to update reviewer assignments:', error)
				toast.error('Unable to update reviewers. Please try again.')
				handleResetSelection(submission.id, previousReviewerIds)
			} finally {
				setSavingSubmissionId(null)
			}
		},
		[handleResetSelection, reviewers, selectionBySubmission]
	)

	const content = useMemo(() => {
		if (!user) {
			return <p>You must be logged in to view your conferences.</p>
		}

		if (user.role !== 'organizer') {
			return <p>Only organizers can view created conferences.</p>
		}

		if (isLoading) {
			return (
				<div className='space-y-4'>
					{Array.from({ length: 2 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className='space-y-2'>
								<Skeleton className='h-5 w-48' />
								<Skeleton className='h-4 w-32' />
							</CardHeader>
							<CardContent className='space-y-2'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-2/3' />
							</CardContent>
						</Card>
					))}
				</div>
			)
		}

		if (error) {
			return <p className='text-sm text-destructive'>{error}</p>
		}

		if (conferences.length === 0) {
			return <p>You have not created any conferences yet.</p>
		}

		return (
			<div className='space-y-4'>
				{conferences.map((conference) => (
					<Card key={conference.id}>
						<CardHeader className='space-y-4'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
								<div className='space-y-1'>
									<CardTitle>{conference.name}</CardTitle>
									<CardDescription className='space-y-1 text-sm text-muted-foreground'>
										{conference.location && <span>{conference.location}</span>}
										{formatConferenceDates(conference.startDate, conference.endDate)}
									</CardDescription>
								</div>
								<Button
									variant='destructive'
									size='sm'
									onClick={() => handleDeleteConference(conference.id)}
									disabled={deletingId === conference.id}
								>
									{deletingId === conference.id ? 'Deleting...' : 'Delete'}
								</Button>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{conference.description && <p className='text-sm text-muted-foreground'>{conference.description}</p>}
							<div>
								<h2 className='text-sm font-medium text-muted-foreground'>Submitted papers</h2>
								{conference.submissions.length === 0 ? (
									<p className='mt-2 text-sm'>No papers have been submitted to this conference yet.</p>
								) : (
									<ul className='mt-3 space-y-3'>
										{conference.submissions.map((submission) => (
											<li
												key={submission.id}
												className='rounded-lg border p-3'
											>
												<div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
													<span className='font-medium'>{submission.title}</span>
													{submission.createdAt && (
														<span className='text-xs text-muted-foreground'>
															Submitted {new Date(submission.createdAt).toLocaleString()}
														</span>
													)}
												</div>
												<div className='mt-2 space-y-2 text-sm text-muted-foreground'>
													<strong className='font-medium text-foreground'>Reviewers:</strong>
													{submission.reviewers.length > 0 ? (
														<ul className='space-y-1'>
															{submission.reviewers.map((reviewer) => (
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
													) : (
														<p className='text-sm'>Not assigned yet</p>
													)}
												</div>
												<div className='mt-3 flex flex-col gap-3'>
													<Button
														variant='secondary'
														size='sm'
														onClick={() => handleToggleSubmission(submission.id)}
													>
														{expandedSubmissionId === submission.id ? 'Hide reviewer selection' : 'Manage reviewers'}
													</Button>
													{expandedSubmissionId === submission.id && (
														<div className='rounded-lg border p-3'>
															<div className='flex items-center justify-between text-sm font-medium'>
																<span>Select reviewers</span>
																<span className='text-xs text-muted-foreground'>
																	{selectionBySubmission[submission.id]?.length ?? 0} selected
																</span>
															</div>
															<div className='mt-3 max-h-52 space-y-2 overflow-y-auto pr-1'>
																{reviewers.length === 0 ? (
																	<p className='text-sm text-muted-foreground'>No reviewers available.</p>
																) : (
																	reviewers.map((reviewer) => {
																		const checked = selectionBySubmission[submission.id]?.includes(reviewer.id) ?? false
																		const controlId = `submission-${submission.id}-reviewer-${reviewer.id}`
																		const statusForReviewer = submission.reviewers.find(
																			(item) => item.id === reviewer.id
																		)?.status

																		return (
																			<label
																				key={reviewer.id}
																				htmlFor={controlId}
																				className='flex items-center justify-between gap-3 rounded-md border px-3 py-2 text-sm'
																			>
																				<span className='flex items-center gap-3'>
																					<Checkbox
																						id={controlId}
																						checked={checked}
																						onCheckedChange={() => handleToggleReviewer(submission.id, reviewer.id)}
																					/>
																					<span>{reviewer.name}</span>
																				</span>
																				{checked && (
																					<span
																						className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getReviewerStatusToneClass(
																							statusForReviewer ?? DEFAULT_REVIEWER_DECISION
																						)}`}
																					>
																						{getReviewerStatusLabel(statusForReviewer ?? DEFAULT_REVIEWER_DECISION)}
																					</span>
																				)}
																			</label>
																		)
																	})
																)}
															</div>
															<div className='mt-3 flex justify-end gap-2'>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() =>
																		handleResetSelection(
																			submission.id,
																			submission.reviewers.map((item) => item.id)
																		)
																	}
																	disabled={savingSubmissionId === submission.id}
																>
																	Reset
																</Button>
																<Button
																	size='sm'
																	onClick={() => handleSaveAssignments(submission)}
																	disabled={
																		savingSubmissionId === submission.id ||
																		(selectionBySubmission[submission.id]?.length ?? 0) === 0
																	}
																>
																	{savingSubmissionId === submission.id ? 'Saving...' : 'Save changes'}
																</Button>
															</div>
														</div>
													)}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}, [
		user,
		isLoading,
		error,
		conferences,
		deletingId,
		handleDeleteConference,
		expandedSubmissionId,
		handleSaveAssignments,
		handleToggleSubmission,
		handleToggleReviewer,
		handleResetSelection,
		savingSubmissionId,
		selectionBySubmission,
		reviewers
	])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-2xl font-semibold tracking-tight'>My Conferences</h1>
				<p className='text-sm text-muted-foreground'>
					Track submissions and reviewer assignments across your conferences.
				</p>
			</header>
			{content}
		</div>
	)
}

function formatConferenceDates(startDate: string | null, endDate: string | null) {
	if (!startDate) {
		return 'Dates to be announced'
	}

	const formatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})

	const start = formatter.format(new Date(startDate))

	if (!endDate) {
		return start
	}

	const end = formatter.format(new Date(endDate))
	return start === end ? start : `${start} - ${end}`
}
