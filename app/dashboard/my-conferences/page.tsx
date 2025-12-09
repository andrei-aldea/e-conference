'use client'

import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import Link from 'next/link'
import { toast } from 'sonner'

import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_REVIEWER_DECISION, getReviewerStatusLabel, getReviewerStatusToneClass } from '@/lib/reviewer/status'
import type { ReviewerDecision } from '@/lib/validation/schemas'

interface PaperFileDetails {
	name: string
	size: number | null
	contentType: string | null
	downloadUrl: string | null
	uploadedAt: string | null
}

interface ReviewerSummary {
	id: string
	name: string
	status: ReviewerDecision
}

interface ConferencePaper {
	id: string
	title: string
	createdAt: string | null
	reviewers: ReviewerSummary[]
	file: PaperFileDetails | null
}

interface OrganizerConference {
	id: string
	name: string
	description?: string
	location?: string
	startDate: string | null
	endDate: string | null
	papers: ConferencePaper[]
}

interface ReviewerOption {
	id: string
	name: string
}

export default function MyConferencesPage() {
	const { data: session } = useSession()
	const user = session?.user
	const [conferences, setConferences] = useState<OrganizerConference[]>([])
	const [reviewers, setReviewers] = useState<ReviewerOption[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [expandedPaperId, setExpandedPaperId] = useState<string | null>(null)
	const [savingPaperId, setSavingPaperId] = useState<string | null>(null)
	const [selectionByPaper, setSelectionByPaper] = useState<Record<string, string[]>>({})

	const handleDeleteConference = useCallback(() => {
		toast.info('Conference deletion is temporarily disabled during migration.')
	}, [])

	useEffect(() => {
		async function loadConferences() {
			if (!user || user.role !== 'organizer') {
				setConferences([])
				setReviewers([])
				setSelectionByPaper({})
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
					conferences: Array<OrganizerConference & { papers?: ConferencePaper[] | null }>
					reviewers?: ReviewerOption[]
				}

				const normalizedConferences: OrganizerConference[] = payload.conferences.map((conference) => ({
					...conference,
					papers: Array.isArray(conference.papers) ? conference.papers : []
				}))

				setConferences(normalizedConferences)
				setReviewers(payload.reviewers ?? [])
				setSelectionByPaper(() => {
					const map: Record<string, string[]> = {}
					for (const conference of normalizedConferences) {
						for (const paper of conference.papers) {
							map[paper.id] = paper.reviewers.map((reviewer) => reviewer.id)
						}
					}
					return map
				})
			} catch (loadError) {
				console.error('Failed to load organizer conferences:', loadError)
				setError('Unable to load your conferences right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadConferences()
	}, [user])

	const handleTogglePaper = useCallback((paperId: string) => {
		setExpandedPaperId((current) => (current === paperId ? null : paperId))
	}, [])

	const handleToggleReviewer = useCallback((paperId: string, reviewerId: string) => {
		setSelectionByPaper((current) => {
			const existing = current[paperId] ?? []
			const next = new Set(existing)
			if (next.has(reviewerId)) {
				next.delete(reviewerId)
			} else {
				next.add(reviewerId)
			}
			return {
				...current,
				[paperId]: Array.from(next)
			}
		})
	}, [])

	const handleResetSelection = useCallback((paperId: string, baseline: string[]) => {
		setSelectionByPaper((current) => ({
			...current,
			[paperId]: baseline
		}))
	}, [])

	const handleSaveAssignments = useCallback(
		async (paper: ConferencePaper) => {
			const selectedReviewerIds = selectionByPaper[paper.id] ?? []
			if (selectedReviewerIds.length === 0) {
				toast.error('Select at least one reviewer before saving.')
				return
			}

			setSavingPaperId(paper.id)
			const previousReviewerIds = paper.reviewers.map((reviewer) => reviewer.id)

			try {
				const response = await fetch('/api/papers', {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ paperId: paper.id, reviewerIds: selectedReviewerIds })
				})

				if (!response.ok) {
					throw new Error('Request failed')
				}

				setConferences((current) =>
					current.map((conference) => {
						const containsPaper = conference.papers.some((entry) => entry.id === paper.id)
						if (!containsPaper) {
							return conference
						}

						return {
							...conference,
							papers: conference.papers.map((entry) => {
								if (entry.id !== paper.id) {
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
						}
					})
				)

				toast.success('Reviewer assignments updated successfully.')
			} catch (assignmentError) {
				console.error('Failed to update reviewer assignments:', assignmentError)
				toast.error('Unable to update reviewers. Please try again.')
				handleResetSelection(paper.id, previousReviewerIds)
			} finally {
				setSavingPaperId(null)
			}
		},
		[handleResetSelection, reviewers, selectionByPaper]
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
								<div className='flex gap-2'>
									<Button
										variant='outline'
										size='sm'
										asChild
									>
										<Link href={`/dashboard/conferences/${conference.id}?edit=true`}>Edit</Link>
									</Button>
									<Button
										variant='destructive'
										size='sm'
										onClick={() => handleDeleteConference()}
									>
										Delete
									</Button>
								</div>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{conference.description && <p className='text-sm text-muted-foreground'>{conference.description}</p>}
							<div>
								<h2 className='text-sm font-medium text-muted-foreground'>Submitted papers</h2>
								{conference.papers.length === 0 ? (
									<p className='mt-2 text-sm'>No papers have been submitted to this conference yet.</p>
								) : (
									<ul className='mt-3 space-y-3'>
										{conference.papers.map((paper) => (
											<li
												key={paper.id}
												className='rounded-lg border p-3'
											>
												<div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
													<span className='font-medium'>{paper.title}</span>
													{paper.createdAt && (
														<span className='text-xs text-muted-foreground'>
															Submitted {new Date(paper.createdAt).toLocaleString()}
														</span>
													)}
												</div>
												{paper.file ? (
													<div className='flex flex-wrap items-center gap-3 text-xs sm:text-sm text-muted-foreground'>
														<span className='font-medium text-foreground'>File:</span>
														{paper.file.downloadUrl ? (
															<Button
																variant='outline'
																size='sm'
																asChild
															>
																<a
																	href={paper.file.downloadUrl}
																	target='_blank'
																	rel='noopener noreferrer'
																>
																	Download PDF
																</a>
															</Button>
														) : (
															<span>No download link available.</span>
														)}
													</div>
												) : (
													<p className='text-xs text-muted-foreground'>No file uploaded yet.</p>
												)}
												<div className='mt-2 space-y-2 text-sm text-muted-foreground'>
													<strong className='font-medium text-foreground'>Reviewers:</strong>
													{paper.reviewers.length > 0 ? (
														<ul className='space-y-1'>
															{paper.reviewers.map((reviewer) => (
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
														onClick={() => handleTogglePaper(paper.id)}
													>
														{expandedPaperId === paper.id ? 'Hide reviewer selection' : 'Manage reviewers'}
													</Button>
													{expandedPaperId === paper.id && (
														<div className='rounded-lg border p-3'>
															<div className='flex items-center justify-between text-sm font-medium'>
																<span>Select reviewers</span>
																<span className='text-xs text-muted-foreground'>
																	{selectionByPaper[paper.id]?.length ?? 0} selected
																</span>
															</div>
															<div className='mt-3 max-h-52 space-y-2 overflow-y-auto pr-1'>
																{reviewers.length === 0 ? (
																	<p className='text-sm text-muted-foreground'>No reviewers available.</p>
																) : (
																	reviewers.map((reviewer) => {
																		const checked = selectionByPaper[paper.id]?.includes(reviewer.id) ?? false
																		const controlId = `paper-${paper.id}-reviewer-${reviewer.id}`
																		const statusForReviewer = paper.reviewers.find(
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
																						onCheckedChange={() => handleToggleReviewer(paper.id, reviewer.id)}
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
																			paper.id,
																			paper.reviewers.map((item) => item.id)
																		)
																	}
																	disabled={savingPaperId === paper.id}
																>
																	Reset
																</Button>
																<Button
																	size='sm'
																	onClick={() => handleSaveAssignments(paper)}
																	disabled={
																		savingPaperId === paper.id || (selectionByPaper[paper.id]?.length ?? 0) === 0
																	}
																>
																	{savingPaperId === paper.id ? 'Saving...' : 'Save changes'}
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
		// deletingId removed
		handleDeleteConference,
		expandedPaperId,
		handleSaveAssignments,
		handleTogglePaper,
		handleToggleReviewer,
		handleResetSelection,
		savingPaperId,
		selectionByPaper,
		reviewers
	])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<PageTitle>My Conferences</PageTitle>
				<PageDescription>Track papers and reviewer assignments across your conferences.</PageDescription>
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
