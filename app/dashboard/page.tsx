'use client'

import { useAuth } from '@/components/auth-provider'
import { AuthorDashboard } from '@/components/dashboard/author-dashboard'
import { OrganizerDashboard } from '@/components/dashboard/organizer-dashboard'
import { ReviewerDashboard } from '@/components/dashboard/reviewer-dashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type User } from '@/lib/schemas'

const roleDisplayNames: Record<User['role'], string> = {
	organizer: 'Organizer',
	author: 'Author',
	reviewer: 'Reviewer'
}

export default function DashboardPage() {
	const { user } = useAuth()
	const roleName = user ? roleDisplayNames[user.role] : ''

	const renderRoleSpecificContent = () => {
		switch (user?.role) {
			case 'organizer':
				return <OrganizerDashboard />
			case 'author':
				return <AuthorDashboard />
			case 'reviewer':
				return <ReviewerDashboard />
			default:
				return <p>Loading your dashboard...</p>
		}
	}

	return (
		<div>
			<h1>Dashboard</h1>
			<Card>
				<CardHeader>
					<CardTitle>Welcome, {user?.name ?? 'User'}!</CardTitle>
					<CardDescription>You are logged in as an {roleName}.</CardDescription>
				</CardHeader>
				<CardContent>{renderRoleSpecificContent()}</CardContent>
			</Card>
		</div>
	)
}
