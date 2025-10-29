'use client'

import { DashboardCommunitySnapshotCard } from '@/components/dashboard/dashboard-community-snapshot-card'
import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state'
import { DashboardLoadingPlaceholder } from '@/components/dashboard/dashboard-loading-placeholder'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

export function AuthorDashboard() {
	const { general, roleStats, isLoading, error, reload } = useDashboardSummary('author', {
		fallbackErrorMessage: 'Unable to load author dashboard. Please try again later.'
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

	if (!general || !roleStats || roleStats.role !== 'author') {
		return (
			<DashboardErrorState
				message='Author insights are currently unavailable. Please try again.'
				onRetry={() => void reload()}
			/>
		)
	}

	return (
		<div className='space-y-6'>
			<section className='space-y-2'>
				<h2 className='text-xl font-semibold'>Author overview</h2>
				<p className='text-sm text-muted-foreground'>
					You champion new ideas and submit work to conferences. E-Conference helps you track your papers, stay close to
					reviewer feedback, and discover the reach of your research across events.
				</p>
			</section>

			<div className='grid gap-4 lg:grid-cols-2'>
				<Card>
					<CardHeader>
						<CardTitle>Your papers</CardTitle>
						<CardDescription>A quick tour of your research footprint.</CardDescription>
					</CardHeader>
					<CardContent className='space-y-3 text-sm text-muted-foreground'>
						<p>
							You have submitted <strong className='text-foreground'>{roleStats.paperCount}</strong> paper
							{roleStats.paperCount === 1 ? '' : 's'} spanning{' '}
							<strong className='text-foreground'>{roleStats.conferenceParticipationCount}</strong> conference
							{roleStats.conferenceParticipationCount === 1 ? '' : 's'}.
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
							Your papers involve <strong className='text-foreground'>{roleStats.totalReviewerAssignments}</strong>{' '}
							reviewer assignment{roleStats.totalReviewerAssignments === 1 ? '' : 's'} across{' '}
							<strong className='text-foreground'>{roleStats.uniqueReviewerCount}</strong> reviewer
							{roleStats.uniqueReviewerCount === 1 ? '' : 's'}.
						</p>
						<ul className='space-y-1'>
							<li>
								<span className='text-foreground'>Pending decisions:</span> {roleStats.pendingReviews}
							</li>
							<li>
								<span className='text-foreground'>Positive decisions:</span> {roleStats.acceptedReviews}
							</li>
							<li>
								<span className='text-foreground'>Declined decisions:</span> {roleStats.declinedReviews}
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<DashboardCommunitySnapshotCard
				description='See how your work fits into the broader platform.'
				stats={general}
			/>
		</div>
	)
}
