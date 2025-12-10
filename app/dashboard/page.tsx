'use client'

import { Calendar, CalendarX, FileText, MapPin, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

import { PageDescription, PageHeader, PageTitle } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardSummary } from '@/hooks/use-dashboard-summary'

interface ConferenceItem {
	id: string
	name: string
	description: string
	location: string
	startDate: string | null
	endDate: string | null
}

export default function DashboardPage() {
	const { data: session, status } = useSession()
	const user = session?.user
	const role = user?.role as 'organizer' | 'author' | 'reviewer' | undefined

	const {
		general,
		roleStats,
		isLoading: statsLoading
	} = useDashboardSummary(role || 'author', {
		fallbackErrorMessage: 'Unable to load dashboard data.'
	})

	const [conferences, setConferences] = useState<ConferenceItem[]>([])
	const [conferencesLoading, setConferencesLoading] = useState(true)

	useEffect(() => {
		async function loadConferences() {
			try {
				const res = await fetch('/api/conferences')
				if (!res.ok) throw new Error('Failed to load')
				const data = await res.json()
				setConferences(data.conferences)
			} catch {
				setConferences([])
			} finally {
				setConferencesLoading(false)
			}
		}
		loadConferences()
	}, [])

	const isLoading = status === 'loading' || statsLoading

	if (isLoading) {
		return (
			<div className='space-y-8'>
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
		<div className='space-y-8'>
			<PageHeader>
				<PageTitle>Welcome, {user?.name || 'User'}</PageTitle>
				<PageDescription>
					{role === 'organizer' && 'Manage your conferences and review submissions.'}
					{role === 'author' && 'Track your paper submissions and reviews.'}
					{role === 'reviewer' && 'View and complete your assigned reviews.'}
				</PageDescription>
			</PageHeader>

			{/* Stats Grid */}
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

			{/* All Conferences Section */}
			<div>
				<div className='flex items-center justify-between mb-4'>
					<h2 className='text-xl font-semibold'>All Conferences</h2>
					<span className='text-sm text-muted-foreground'>{conferences.length} conferences</span>
				</div>

				{conferencesLoading ? (
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{[1, 2, 3].map((i) => (
							<Card key={i}>
								<CardHeader>
									<Skeleton className='h-5 w-3/4' />
								</CardHeader>
								<CardContent className='space-y-2'>
									<Skeleton className='h-4 w-full' />
									<Skeleton className='h-4 w-1/2' />
								</CardContent>
							</Card>
						))}
					</div>
				) : conferences.length === 0 ? (
					<Card>
						<CardContent className='flex flex-col items-center py-12 text-center'>
							<CalendarX className='h-12 w-12 text-muted-foreground mb-4' />
							<h3 className='text-lg font-medium'>No conferences yet</h3>
							<p className='text-muted-foreground mt-2'>There are no conferences available at the moment.</p>
						</CardContent>
					</Card>
				) : (
					<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
						{conferences.map((conf) => (
							<Card key={conf.id}>
								<CardHeader className='pb-3'>
									<CardTitle className='text-lg'>{conf.name}</CardTitle>
									{conf.description && <CardDescription className='line-clamp-2'>{conf.description}</CardDescription>}
								</CardHeader>
								<CardContent className='space-y-2'>
									{conf.location && (
										<div className='flex items-center gap-2 text-sm text-muted-foreground'>
											<MapPin className='h-4 w-4' />
											{conf.location}
										</div>
									)}
									{conf.startDate && (
										<div className='flex items-center gap-2 text-sm text-muted-foreground'>
											<Calendar className='h-4 w-4' />
											{formatDate(conf.startDate)}
											{conf.endDate && ` - ${formatDate(conf.endDate)}`}
										</div>
									)}
								</CardContent>
							</Card>
						))}
					</div>
				)}
			</div>
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

function getStatsForRole(
	role: 'organizer' | 'author' | 'reviewer' | undefined,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	roleStats: any,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	general: any
) {
	if (!roleStats || !general) {
		return [{ label: 'Loading...', value: '-', icon: Users }]
	}

	switch (role) {
		case 'organizer':
			return [
				{ label: 'My Conferences', value: roleStats.conferenceCount || 0, icon: Calendar },
				{ label: 'Total Papers', value: roleStats.paperCount || 0, icon: FileText },
				{ label: 'Pending Reviews', value: roleStats.pendingDecisions || 0, icon: Users }
			]
		case 'author':
			return [
				{ label: 'My Papers', value: roleStats.paperCount || 0, icon: FileText },
				{ label: 'Conferences', value: roleStats.conferenceParticipationCount || 0, icon: Calendar },
				{ label: 'Pending Reviews', value: roleStats.pendingReviews || 0, icon: Users }
			]
		case 'reviewer':
			return [
				{ label: 'Assigned Papers', value: roleStats.assignedPaperCount || 0, icon: FileText },
				{ label: 'Completed Reviews', value: roleStats.completedReviews || 0, icon: Calendar },
				{ label: 'Pending', value: roleStats.pendingReviews || 0, icon: Users }
			]
		default:
			return [
				{ label: 'Total Users', value: general.totalUsers || 0, icon: Users },
				{ label: 'Total Conferences', value: general.totalConferences || 0, icon: Calendar },
				{ label: 'Total Papers', value: general.totalPapers || 0, icon: FileText }
			]
	}
}
