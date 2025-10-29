'use client'

import { DashboardCommunitySnapshotCard } from '@/components/dashboard/dashboard-community-snapshot-card'
import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state'
import { DashboardLoadingPlaceholder } from '@/components/dashboard/dashboard-loading-placeholder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

export function ReviewerDashboard() {
	const { general, roleStats, isLoading, error, reload } = useDashboardSummary('reviewer', {
		fallbackErrorMessage: 'Unable to load reviewer dashboard. Please try again later.'
	})

	if (isLoading) {
		return <DashboardLoadingPlaceholder />
	}

	if (error) {
		return (
			<DashboardErrorState
				message={error}
				onRetry={() => void reload()}
			/>
		)
	}

	if (!general || !roleStats || roleStats.role !== 'reviewer') {
		return (
			<DashboardErrorState
				message='Reviewer insights are currently unavailable. Please try again.'
				onRetry={() => void reload()}
			/>
		)
	}

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
							You are assigned to <strong className='text-foreground'>{roleStats.assignedPaperCount}</strong> paper
							review{roleStats.assignedPaperCount === 1 ? '' : 's'} across{' '}
							<strong className='text-foreground'>{roleStats.conferencesCovered}</strong> conference
							{roleStats.conferencesCovered === 1 ? '' : 's'}.
						</p>
						<p>
							<span className='text-foreground'>Latest assignment:</span>{' '}
							{roleStats.latestAssignedPaperTitle ? (
								<>
									{roleStats.latestAssignedPaperTitle} added on{' '}
									<span className='text-foreground'>
										{roleStats.latestAssignedPaperAt
											? new Date(roleStats.latestAssignedPaperAt).toLocaleDateString()
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
							You have completed <strong className='text-foreground'>{roleStats.completedReviews}</strong> review
							{roleStats.completedReviews === 1 ? '' : 's'} for{' '}
							<strong className='text-foreground'>{roleStats.distinctAuthors}</strong> distinct author
							{roleStats.distinctAuthors === 1 ? '' : 's'}.
						</p>
						<ul className='space-y-1'>
							<li>
								<span className='text-foreground'>Pending decisions:</span> {roleStats.pendingReviews}
							</li>
							<li>
								<span className='text-foreground'>Accepted decisions:</span> {roleStats.acceptedDecisions}
							</li>
							<li>
								<span className='text-foreground'>Declined decisions:</span> {roleStats.declinedDecisions}
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<DashboardCommunitySnapshotCard
				description='Understand the scale of research happening around you.'
				stats={general}
			/>
		</div>
	)
}
