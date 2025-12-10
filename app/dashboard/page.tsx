'use client'

import { useSession } from 'next-auth/react'

import { PageDescription, PageHeader, PageTitle } from '@/components/layout/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'
import { BarChart3, FileText, Users } from 'lucide-react'

export default function DashboardPage() {
	const { data: session, status } = useSession()
	const user = session?.user
	const role = user?.role as 'organizer' | 'author' | 'reviewer' | undefined

	const { general, roleStats, isLoading } = useDashboardSummary(role || 'author', {
		fallbackErrorMessage: 'Unable to load dashboard data.'
	})

	if (status === 'loading' || isLoading) {
		return (
			<div>
				<PageHeader>
					<Skeleton className='h-8 w-48' />
					<Skeleton className='mt-2 h-4 w-64' />
				</PageHeader>
				<div className='grid gap-4 md:grid-cols-3'>
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className='h-4 w-24' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-8 w-16' />
							</CardContent>
						</Card>
					))}
				</div>
			</div>
		)
	}

	const stats = getStatsForRole(role, roleStats, general)

	return (
		<div>
			<PageHeader>
				<PageTitle>Welcome, {user?.name || 'User'}</PageTitle>
				<PageDescription>
					{role === 'organizer' && 'Manage your conferences and review submissions.'}
					{role === 'author' && 'Track your paper submissions and reviews.'}
					{role === 'reviewer' && 'View and complete your assigned reviews.'}
				</PageDescription>
			</PageHeader>

			<div className='grid gap-4 md:grid-cols-3'>
				{stats.map((stat) => (
					<Card key={stat.label}>
						<CardHeader className='flex flex-row items-center justify-between pb-2'>
							<CardTitle className='text-sm font-medium text-muted-foreground'>{stat.label}</CardTitle>
							<stat.icon className='h-4 w-4 text-muted-foreground' />
						</CardHeader>
						<CardContent>
							<div className='text-2xl font-bold'>{stat.value}</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}

function getStatsForRole(
	role: 'organizer' | 'author' | 'reviewer' | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	roleStats: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	general: any
) {
	if (!roleStats || !general) {
		return [
			{ label: 'Loading...', value: '-', icon: BarChart3 },
			{ label: 'Loading...', value: '-', icon: FileText },
			{ label: 'Loading...', value: '-', icon: Users }
		]
	}

	switch (role) {
		case 'organizer':
			return [
				{ label: 'My Conferences', value: roleStats.conferenceCount || 0, icon: BarChart3 },
				{ label: 'Total Papers', value: roleStats.paperCount || 0, icon: FileText },
				{ label: 'Pending Reviews', value: roleStats.pendingDecisions || 0, icon: Users }
			]
		case 'author':
			return [
				{ label: 'My Papers', value: roleStats.paperCount || 0, icon: FileText },
				{ label: 'Conferences', value: roleStats.conferenceParticipationCount || 0, icon: BarChart3 },
				{ label: 'Pending Reviews', value: roleStats.pendingReviews || 0, icon: Users }
			]
		case 'reviewer':
			return [
				{ label: 'Assigned Papers', value: roleStats.assignedPaperCount || 0, icon: FileText },
				{ label: 'Completed Reviews', value: roleStats.completedReviews || 0, icon: BarChart3 },
				{ label: 'Pending', value: roleStats.pendingReviews || 0, icon: Users }
			]
		default:
			return [
				{ label: 'Total Users', value: general.totalUsers || 0, icon: Users },
				{ label: 'Total Conferences', value: general.totalConferences || 0, icon: BarChart3 },
				{ label: 'Total Papers', value: general.totalPapers || 0, icon: FileText }
			]
	}
}
