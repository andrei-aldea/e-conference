'use client'

import { DashboardCommunitySnapshotCard } from '@/components/dashboard/dashboard-community-snapshot-card'
import { DashboardLoadingPlaceholder } from '@/components/dashboard/dashboard-loading-placeholder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

export function OrganizerDashboard() {
	const { general, roleStats, isLoading, error } = useDashboardSummary('organizer', {
		fallbackErrorMessage: 'Unable to load organizer dashboard. Please try again later.'
	})

	if (isLoading) {
		return <DashboardLoadingPlaceholder />
	}

	if (error) {
		return <p className='text-sm text-destructive'>{error}</p>
	}

	if (!general || !roleStats || roleStats.role !== 'organizer') {
		return null
	}

	return (
		<div className='space-y-6'>
			<section className='space-y-2'>
				<h2 className='text-xl font-semibold'>Organizer overview</h2>
				<p className='text-sm text-muted-foreground'>
					You orchestrate the full submission pipeline—from creating conferences to assigning reviewers. E-Conference keeps your
					events organised so you can focus on curating memorable programs and supporting your community.
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
							You are managing <strong className='text-foreground'>{roleStats.conferenceCount}</strong> conference
							{roleStats.conferenceCount === 1 ? '' : 's'} with{' '}
							<strong className='text-foreground'>{roleStats.paperCount}</strong> paper
							{roleStats.paperCount === 1 ? '' : 's'}.
						</p>
						<p>
							<span className='text-foreground'>Latest conference:</span>{' '}
							{roleStats.latestConferenceName ? (
								<>
									{roleStats.latestConferenceName} starting{' '}
									<span className='text-foreground'>
										{roleStats.latestConferenceStart
											? new Date(roleStats.latestConferenceStart).toLocaleDateString()
											: 'soon'}
									</span>
								</>
							) : (
								'You have not scheduled any conferences yet.'
							)}
						</p>
						<p>
							<span className='text-foreground'>Latest paper:</span>{' '}
							{roleStats.latestPaperTitle ? (
								<>
									{roleStats.latestPaperTitle} submitted on{' '}
									<span className='text-foreground'>
										{roleStats.latestPaperCreatedAt
											? new Date(roleStats.latestPaperCreatedAt).toLocaleDateString()
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
							You have coordinated <strong className='text-foreground'>{roleStats.totalReviewAssignments}</strong>{' '}
							reviewer assignment{roleStats.totalReviewAssignments === 1 ? '' : 's'} involving{' '}
							<strong className='text-foreground'>{roleStats.uniqueReviewerCount}</strong> unique reviewer
							{roleStats.uniqueReviewerCount === 1 ? '' : 's'}.
						</p>
						<ul className='space-y-1'>
							<li>
								<span className='text-foreground'>Pending reviews:</span> {roleStats.pendingDecisions}
							</li>
							<li>
								<span className='text-foreground'>Accepted reviews:</span> {roleStats.acceptedDecisions}
							</li>
							<li>
								<span className='text-foreground'>Declined reviews:</span> {roleStats.declinedDecisions}
							</li>
						</ul>
						<p>
							<strong className='text-foreground'>{roleStats.uniqueAuthorCount}</strong> different author
							{roleStats.uniqueAuthorCount === 1 ? '' : 's'} have contributed papers to your conferences.
						</p>
					</CardContent>
				</Card>
			</div>

			<DashboardCommunitySnapshotCard
				description='The bigger picture inside E-Conference.'
				stats={general}
			/>
		</div>
	)
}
