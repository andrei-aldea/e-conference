'use client'

import { Calendar, ChevronDown, ChevronRight, Download, MapPin, MoreHorizontal, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { PageDescription, PageHeader, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { DEFAULT_REVIEWER_DECISION, getReviewerStatusLabel } from '@/lib/reviewer/status'
import type { ReviewerDecision } from '@/lib/validation/schemas'

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
	file: { downloadUrl: string | null } | null
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
	const [expandedConference, setExpandedConference] = useState<string | null>(null)
	const [assigningPaper, setAssigningPaper] = useState<string | null>(null)
	const [selectedReviewers, setSelectedReviewers] = useState<Record<string, string[]>>({})
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		async function load() {
			if (!user || user.role !== 'organizer') {
				setIsLoading(false)
				return
			}

			try {
				const res = await fetch('/api/conferences?scope=organizer')
				if (!res.ok) throw new Error('Failed to load')
				const data = await res.json()
				const confs = data.conferences.map((c: OrganizerConference) => ({
					...c,
					papers: c.papers || []
				}))
				setConferences(confs)
				setReviewers(data.reviewers || [])

				// Initialize selected reviewers from existing assignments
				const selections: Record<string, string[]> = {}
				for (const conf of confs) {
					for (const paper of conf.papers) {
						selections[paper.id] = paper.reviewers.map((r: ReviewerSummary) => r.id)
					}
				}
				setSelectedReviewers(selections)
			} catch {
				setError('Failed to load conferences')
			} finally {
				setIsLoading(false)
			}
		}
		load()
	}, [user])

	const toggleReviewer = useCallback((paperId: string, reviewerId: string) => {
		setSelectedReviewers((prev) => {
			const current = prev[paperId] || []
			const updated = current.includes(reviewerId)
				? current.filter((id) => id !== reviewerId)
				: [...current, reviewerId]
			return { ...prev, [paperId]: updated }
		})
	}, [])

	const saveAssignments = useCallback(
		async (paper: ConferencePaper) => {
			const ids = selectedReviewers[paper.id] || []
			if (ids.length === 0) {
				toast.error('Select at least one reviewer')
				return
			}

			setSaving(true)
			try {
				const res = await fetch('/api/papers', {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ paperId: paper.id, reviewerIds: ids })
				})
				if (!res.ok) throw new Error()

				// Update local state
				setConferences((prev) =>
					prev.map((conf) => ({
						...conf,
						papers: conf.papers.map((p) => {
							if (p.id !== paper.id) return p
							return {
								...p,
								reviewers: ids.map((id) => {
									const existing = p.reviewers.find((r) => r.id === id)
									if (existing) return existing
									const reviewer = reviewers.find((r) => r.id === id)
									return { id, name: reviewer?.name || 'Reviewer', status: DEFAULT_REVIEWER_DECISION }
								})
							}
						})
					}))
				)

				toast.success('Reviewers updated')
				setAssigningPaper(null)
			} catch {
				toast.error('Failed to save')
			} finally {
				setSaving(false)
			}
		},
		[selectedReviewers, reviewers]
	)

	if (!user) {
		return (
			<div>
				<PageHeader>
					<PageTitle>My Conferences</PageTitle>
				</PageHeader>
				<p className='text-muted-foreground'>Please log in to view your conferences.</p>
			</div>
		)
	}

	if (user.role !== 'organizer') {
		return (
			<div>
				<PageHeader>
					<PageTitle>My Conferences</PageTitle>
				</PageHeader>
				<p className='text-muted-foreground'>Only organizers can view this page.</p>
			</div>
		)
	}

	return (
		<div>
			<PageHeader>
				<div className='flex items-center justify-between'>
					<div>
						<PageTitle>My Conferences</PageTitle>
						<PageDescription>Manage your conferences and paper assignments.</PageDescription>
					</div>
					<Button asChild>
						<Link href='/dashboard/conferences/new'>New Conference</Link>
					</Button>
				</div>
			</PageHeader>

			{isLoading && (
				<div className='space-y-4'>
					{[1, 2].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className='h-6 w-48' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-4 w-full' />
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{error && <p className='text-destructive'>{error}</p>}

			{!isLoading && !error && conferences.length === 0 && (
				<Card>
					<CardContent className='py-8 text-center'>
						<p className='text-muted-foreground'>You haven&apos;t created any conferences yet.</p>
						<Button
							asChild
							className='mt-4'
						>
							<Link href='/dashboard/conferences/new'>Create your first conference</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{!isLoading && !error && conferences.length > 0 && (
				<div className='space-y-4'>
					{conferences.map((conf) => (
						<Card key={conf.id}>
							<CardHeader
								className='cursor-pointer'
								onClick={() => setExpandedConference(expandedConference === conf.id ? null : conf.id)}
							>
								<div className='flex items-center justify-between'>
									<div className='flex items-center gap-3'>
										{expandedConference === conf.id ? (
											<ChevronDown className='h-5 w-5 text-muted-foreground' />
										) : (
											<ChevronRight className='h-5 w-5 text-muted-foreground' />
										)}
										<div>
											<CardTitle className='text-lg'>{conf.name}</CardTitle>
											<div className='mt-1 flex items-center gap-4 text-sm text-muted-foreground'>
												{conf.location && (
													<span className='flex items-center gap-1'>
														<MapPin className='h-3 w-3' />
														{conf.location}
													</span>
												)}
												{conf.startDate && (
													<span className='flex items-center gap-1'>
														<Calendar className='h-3 w-3' />
														{formatDate(conf.startDate)}
													</span>
												)}
												<span className='flex items-center gap-1'>
													<Users className='h-3 w-3' />
													{conf.papers.length} papers
												</span>
											</div>
										</div>
									</div>
									<DropdownMenu>
										<DropdownMenuTrigger
											asChild
											onClick={(e) => e.stopPropagation()}
										>
											<Button
												variant='ghost'
												size='icon'
											>
												<MoreHorizontal className='h-4 w-4' />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align='end'>
											<DropdownMenuItem asChild>
												<Link href={`/dashboard/conferences/${conf.id}?edit=true`}>Edit</Link>
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => toast.info('Deletion disabled')}>Delete</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</CardHeader>

							{expandedConference === conf.id && (
								<CardContent>
									{conf.papers.length === 0 ? (
										<p className='text-sm text-muted-foreground'>No papers submitted yet.</p>
									) : (
										<div className='overflow-x-auto'>
											<table className='w-full text-sm'>
												<thead>
													<tr className='border-b text-left'>
														<th className='pb-2 font-medium'>Paper</th>
														<th className='pb-2 font-medium'>Submitted</th>
														<th className='pb-2 font-medium'>Reviewers</th>
														<th className='pb-2 font-medium'>Actions</th>
													</tr>
												</thead>
												<tbody>
													{conf.papers.map((paper) => (
														<tr
															key={paper.id}
															className='border-b last:border-0'
														>
															<td className='py-3 pr-4'>
																<span className='font-medium'>{paper.title}</span>
															</td>
															<td className='py-3 pr-4 text-muted-foreground'>
																{paper.createdAt ? formatDate(paper.createdAt) : '-'}
															</td>
															<td className='py-3 pr-4'>
																{paper.reviewers.length === 0 ? (
																	<span className='text-muted-foreground'>None assigned</span>
																) : (
																	<div className='flex flex-wrap gap-1'>
																		{paper.reviewers.map((r) => (
																			<span
																				key={r.id}
																				className='inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs'
																			>
																				{r.name}
																				<span className='ml-1 text-muted-foreground'>
																					({getReviewerStatusLabel(r.status)})
																				</span>
																			</span>
																		))}
																	</div>
																)}
															</td>
															<td className='py-3'>
																<div className='flex items-center gap-2'>
																	{paper.file?.downloadUrl && (
																		<Button
																			variant='ghost'
																			size='icon'
																			asChild
																		>
																			<a
																				href={paper.file.downloadUrl}
																				target='_blank'
																				rel='noopener noreferrer'
																			>
																				<Download className='h-4 w-4' />
																			</a>
																		</Button>
																	)}
																	<Button
																		variant='outline'
																		size='sm'
																		onClick={() => setAssigningPaper(assigningPaper === paper.id ? null : paper.id)}
																	>
																		{assigningPaper === paper.id ? 'Cancel' : 'Assign'}
																	</Button>
																</div>
															</td>
														</tr>
													))}
												</tbody>
											</table>

											{assigningPaper && conf.papers.find((p) => p.id === assigningPaper) && (
												<div className='mt-4 rounded-lg border p-4'>
													<h4 className='mb-3 font-medium'>Assign Reviewers</h4>
													{reviewers.length === 0 ? (
														<p className='text-sm text-muted-foreground'>No reviewers available.</p>
													) : (
														<div className='space-y-2'>
															{reviewers.map((r) => (
																<label
																	key={r.id}
																	className='flex items-center gap-2 text-sm'
																>
																	<Checkbox
																		checked={selectedReviewers[assigningPaper]?.includes(r.id) || false}
																		onCheckedChange={() => toggleReviewer(assigningPaper, r.id)}
																	/>
																	{r.name}
																</label>
															))}
															<div className='mt-4 flex gap-2'>
																<Button
																	size='sm'
																	disabled={saving}
																	onClick={() => {
																		const paper = conf.papers.find((p) => p.id === assigningPaper)
																		if (paper) saveAssignments(paper)
																	}}
																>
																	{saving ? 'Saving...' : 'Save'}
																</Button>
																<Button
																	variant='ghost'
																	size='sm'
																	onClick={() => setAssigningPaper(null)}
																>
																	Cancel
																</Button>
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									)}
								</CardContent>
							)}
						</Card>
					))}
				</div>
			)}
		</div>
	)
}

function formatDate(dateString: string) {
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})
}
