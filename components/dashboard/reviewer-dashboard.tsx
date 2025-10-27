'use client'

import { useEffect, useMemo, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ReviewerStatsPayload {
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

interface DashboardSummaryResponse {
	general: {
		totalConferences: number
		totalPapers: number
		totalReviewers: number
		totalAuthors: number
		totalOrganizers: number
		totalUsers: number
	}
	role: ReviewerStatsPayload | null
}

export function ReviewerDashboard() {
	const [data, setData] = useState<DashboardSummaryResponse | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		let isMounted = true

		async function load() {
			try {
				const response = await fetch('/api/dashboard')
				if (!response.ok) {
					throw new Error('Failed to load dashboard summary')
				}
				const payload = (await response.json()) as DashboardSummaryResponse
				if (isMounted) {
					setData(payload)
				}
			} catch (loadError) {
				console.error('Failed to load reviewer dashboard summary:', loadError)
				if (isMounted) {
					setError('Unable to load reviewer dashboard. Please try again later.')
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		void load()

		return () => {
			isMounted = false
		}
	}, [])

	const reviewer = useMemo(() => {
		if (!data || !data.role || data.role.role !== 'reviewer') {
			return null
		}
		return data.role
	}, [data])

	if (isLoading) {
		return (
			<div className='space-y-4'>
				<Card>
					<CardHeader>
						<CardTitle>
							<Skeleton className='h-5 w-40' />
						</CardTitle>
						<CardDescription>
							<Skeleton className='h-4 w-64' />
						</CardDescription>
					</CardHeader>
					<CardContent className='space-y-2'>
						{Array.from({ length: 4 }).map((_, index) => (
							<div
								key={index}
								className='flex items-center justify-between'
							>
								<Skeleton className='h-4 w-48' />
								<Skeleton className='h-4 w-24' />
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		)
	}

	if (error) {
		return <p className='text-sm text-destructive'>{error}</p>
	}

	if (!data || !reviewer) {
		return null
	}

	const { totalConferences, totalPapers, totalReviewers, totalAuthors, totalOrganizers, totalUsers } = data.general

	return (
		<div className='space-y-6'>
			<section className='space-y-2'>
				<h2 className='text-xl font-semibold'>Reviewer overview</h2>
				<p className='text-sm text-muted-foreground'>
					You safeguard quality by giving thoughtful feedback. E-Conference keeps assignments organised so you can focus
					on clear decisions and timely reviews.
				</p>
			</section>

			<div className='grid gap-4 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Your assignments</CardTitle>
						<CardDescription>Everything on your review plate right now.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							You are assigned to <strong className='text-foreground'>{reviewer.assignedPaperCount}</strong> paper
							review{reviewer.assignedPaperCount === 1 ? '' : 's'} across{' '}
							<strong className='text-foreground'>{reviewer.conferencesCovered}</strong> conference
							{reviewer.conferencesCovered === 1 ? '' : 's'}.
						</p>
						<p>
							<span className='text-foreground'>Latest assignment:</span>{' '}
							{reviewer.latestAssignedPaperTitle ? (
								<>
									{reviewer.latestAssignedPaperTitle} added on{' '}
									<span className='text-foreground'>
										{reviewer.latestAssignedPaperAt
											? new Date(reviewer.latestAssignedPaperAt).toLocaleDateString()
											: 'unknown'}
									</span>
								</>
							) : (
								'No papers assigned yet—watch for invitations soon.'
							)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Review decisions</CardTitle>
						<CardDescription>Track your progress at a glance.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							You have completed <strong className='text-foreground'>{reviewer.completedReviews}</strong> review
							{reviewer.completedReviews === 1 ? '' : 's'} for{' '}
							<strong className='text-foreground'>{reviewer.distinctAuthors}</strong> distinct author
							{reviewer.distinctAuthors === 1 ? '' : 's'}.
						</p>
						<ul className='space-y-1'>
							<li>
								<span className='text-foreground'>Pending decisions:</span> {reviewer.pendingReviews}
							</li>
							<li>
								<span className='text-foreground'>Accepted decisions:</span> {reviewer.acceptedDecisions}
							</li>
							<li>
								<span className='text-foreground'>Declined decisions:</span> {reviewer.declinedDecisions}
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Community snapshot</CardTitle>
					<CardDescription>Understand the scale of research happening around you.</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
						<StatBlock
							label='Conferences in the platform'
							value={totalConferences}
						/>
						<StatBlock
							label='Total submitted papers'
							value={totalPapers}
						/>
						<StatBlock
							label='Registered reviewers'
							value={totalReviewers}
						/>
						<StatBlock
							label='Registered authors'
							value={totalAuthors}
						/>
						<StatBlock
							label='Registered organizers'
							value={totalOrganizers}
						/>
						<StatBlock
							label='Community members overall'
							value={totalUsers}
						/>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function StatBlock({ label, value }: { label: string; value: number }) {
	return (
		<div className='rounded-lg border p-3 text-sm'>
			<p className='text-muted-foreground'>{label}</p>
			<p className='mt-2 text-2xl font-semibold'>{value}</p>
		</div>
	)
}
