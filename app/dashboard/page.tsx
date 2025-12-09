'use client'

import { AuthorDashboard } from '@/components/dashboard/author-dashboard'
import { DashboardErrorState } from '@/components/dashboard/dashboard-error-state'
import { DashboardLoadingPlaceholder } from '@/components/dashboard/dashboard-loading-placeholder'
import { OrganizerDashboard } from '@/components/dashboard/organizer-dashboard'
import { ReviewerDashboard } from '@/components/dashboard/reviewer-dashboard'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { User } from '@/lib/validation/schemas'
import { useSession } from 'next-auth/react'

const roleDisplayNames: Record<User['role'], string> = {
	organizer: 'Organizer',
	author: 'Author',
	reviewer: 'Reviewer'
}

export default function DashboardPage() {
	const { data: session, status } = useSession()
	const user = session?.user
	const isAuthLoading = status === 'loading'
	const roleName = user?.role ? roleDisplayNames[user.role as keyof typeof roleDisplayNames] : ''

	const renderRoleSpecificContent = () => {
		if (isAuthLoading) {
			return <DashboardLoadingPlaceholder />
		}

		if (!user) {
			return (
				<DashboardErrorState
					message='We could not load your dashboard. Please log in again.'
					onRetry={() => window.location.reload()}
				/>
			)
		}

		switch (user?.role) {
			case 'organizer':
				return <OrganizerDashboard />
			case 'author':
				return <AuthorDashboard />
			case 'reviewer':
				return <ReviewerDashboard />
			default:
				return (
					<DashboardErrorState
						message='Your role could not be determined. Please refresh the page.'
						onRetry={() => window.location.reload()}
					/>
				)
		}
	}

	const cardDescription = isAuthLoading
		? 'Loading your access...'
		: user
		? `Signed in role: ${roleName || 'Unknown'}.`
		: 'Signed in role: unavailable.'

	return (
		<div>
			<PageTitle>Dashboard</PageTitle>
			<PageDescription>Here you can see detailed analytics about your role!</PageDescription>
			<br />
			<Card>
				<CardHeader>
					<CardTitle>Welcome, {user?.name ?? 'there'}!</CardTitle>
					<CardDescription>{cardDescription}</CardDescription>
				</CardHeader>
				<CardContent>{renderRoleSpecificContent()}</CardContent>
			</Card>
		</div>
	)
}
