'use client'

import { useEffect, useMemo, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface AuthorStatsPayload {
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

interface DashboardSummaryResponse {
	general: {
		totalConferences: number
		totalPapers: number
		totalReviewers: number
		totalAuthors: number
		totalOrganizers: number
		totalUsers: number
	}
	role: AuthorStatsPayload | null
}

export function AuthorDashboard() {
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
				console.error('Failed to load author dashboard summary:', loadError)
				if (isMounted) {
					setError('Unable to load author dashboard. Please try again later.')
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

	const author = useMemo(() => {
		if (!data || !data.role || data.role.role !== 'author') {
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

	if (!data || !author) {
		return null
	}

	const { totalConferences, totalPapers, totalReviewers, totalAuthors, totalOrganizers, totalUsers } = data.general

	return (
		<div className='space-y-6'>
			<section className='space-y-2'>
				<h2 className='text-xl font-semibold'>Author overview</h2>
				<p className='text-sm text-muted-foreground'>
					You champion new ideas and submit work to conferences. E-Conference helps you track submissions, stay close to
					reviewer feedback, and discover the reach of your research across events.
				</p>
			</section>

			<div className='grid gap-4 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Your submissions</CardTitle>
						<CardDescription>A quick tour of your research footprint.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							You have submitted <strong className='text-foreground'>{author.paperCount}</strong> paper submission
							{author.paperCount === 1 ? '' : 's'} spanning{' '}
							<strong className='text-foreground'>{author.conferenceParticipationCount}</strong> conference
							{author.conferenceParticipationCount === 1 ? '' : 's'}.
						</p>
						<p>
							<span className='text-foreground'>Latest paper:</span>{' '}
							{author.latestPaperTitle ? (
								<>
									{author.latestPaperTitle} submitted on{' '}
									<span className='text-foreground'>
										{author.latestPaperCreatedAt
											? new Date(author.latestPaperCreatedAt).toLocaleDateString()
											: 'unknown'}
									</span>
								</>
							) : (
								'No papers submitted yet—your next idea is waiting!'
							)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Reviewer interactions</CardTitle>
						<CardDescription>Keep tabs on how reviewers are engaging with your work.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							Your papers involve <strong className='text-foreground'>{author.totalReviewerAssignments}</strong>{' '}
							reviewer assignment{author.totalReviewerAssignments === 1 ? '' : 's'} across{' '}
							<strong className='text-foreground'>{author.uniqueReviewerCount}</strong> reviewer
							{author.uniqueReviewerCount === 1 ? '' : 's'}.
						</p>
						<ul className='space-y-1'>
							<li>
								<span className='text-foreground'>Pending decisions:</span> {author.pendingReviews}
							</li>
							<li>
								<span className='text-foreground'>Positive decisions:</span> {author.acceptedReviews}
							</li>
							<li>
								<span className='text-foreground'>Declined decisions:</span> {author.declinedReviews}
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Community snapshot</CardTitle>
					<CardDescription>See how your work fits into the broader platform.</CardDescription>
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
