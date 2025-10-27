'use client'

import { useEffect, useMemo, useState } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface OrganizerStatsPayload {
	role: 'organizer'
	conferenceCount: number
	paperCount: number
	totalReviewAssignments: number
	pendingDecisions: number
	acceptedDecisions: number
	declinedDecisions: number
	uniqueReviewerCount: number
	uniqueAuthorCount: number
	latestConferenceName: string | null
	latestConferenceStart: string | null
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
	role: OrganizerStatsPayload | null
}

export function OrganizerDashboard() {
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
				console.error('Failed to load organizer dashboard summary:', loadError)
				if (isMounted) {
					setError('Unable to load organizer dashboard. Please try again later.')
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

	const organizer = useMemo(() => {
		if (!data || !data.role || data.role.role !== 'organizer') {
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

	if (!data || !organizer) {
		return null
	}

	const { totalConferences, totalPapers, totalReviewers, totalAuthors, totalOrganizers, totalUsers } = data.general

	return (
		<div className='space-y-6'>
			<section className='space-y-2'>
				<h2 className='text-xl font-semibold'>Organizer overview</h2>
				<p className='text-sm text-muted-foreground'>
					You orchestrate the full submission pipeline—from creating calls to assigning reviewers. E-Conference keeps
					your events organised so you can focus on curating memorable programs and supporting your community.
				</p>
			</section>

			<div className='grid gap-4 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Your conferences</CardTitle>
						<CardDescription>How your events are shaping the research landscape.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							You are managing <strong className='text-foreground'>{organizer.conferenceCount}</strong> conference
							{organizer.conferenceCount === 1 ? '' : 's'} with{' '}
							<strong className='text-foreground'>{organizer.paperCount}</strong> paper submission
							{organizer.paperCount === 1 ? '' : 's'}.
						</p>
						<p>
							<span className='text-foreground'>Latest conference:</span>{' '}
							{organizer.latestConferenceName ? (
								<>
									{organizer.latestConferenceName} starting{' '}
									<span className='text-foreground'>
										{organizer.latestConferenceStart
											? new Date(organizer.latestConferenceStart).toLocaleDateString()
											: 'soon'}
									</span>
								</>
							) : (
								'You have not scheduled any conferences yet.'
							)}
						</p>
						<p>
							<span className='text-foreground'>Latest paper:</span>{' '}
							{organizer.latestPaperTitle ? (
								<>
									{organizer.latestPaperTitle} submitted on{' '}
									<span className='text-foreground'>
										{organizer.latestPaperCreatedAt
											? new Date(organizer.latestPaperCreatedAt).toLocaleDateString()
											: 'unknown'}
									</span>
								</>
							) : (
								'No papers have been submitted yet.'
							)}
						</p>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Reviewer engagement</CardTitle>
						<CardDescription>Assignments and decisions across your reviewer pool.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							You have coordinated <strong className='text-foreground'>{organizer.totalReviewAssignments}</strong>{' '}
							reviewer assignment{organizer.totalReviewAssignments === 1 ? '' : 's'} involving{' '}
							<strong className='text-foreground'>{organizer.uniqueReviewerCount}</strong> unique reviewer
							{organizer.uniqueReviewerCount === 1 ? '' : 's'}.
						</p>
						<ul className='space-y-1'>
							<li>
								<span className='text-foreground'>Pending reviews:</span> {organizer.pendingDecisions}
							</li>
							<li>
								<span className='text-foreground'>Accepted reviews:</span> {organizer.acceptedDecisions}
							</li>
							<li>
								<span className='text-foreground'>Declined reviews:</span> {organizer.declinedDecisions}
							</li>
						</ul>
						<p>
							<strong className='text-foreground'>{organizer.uniqueAuthorCount}</strong> different author
							{organizer.uniqueAuthorCount === 1 ? '' : 's'} have contributed papers to your conferences.
						</p>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Community snapshot</CardTitle>
					<CardDescription>The bigger picture inside E-Conference.</CardDescription>
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
