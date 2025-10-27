'use client'

import { StatBlock } from '@/components/dashboard/stat-block'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { DashboardGeneralStats } from '@/lib/dashboard/summary'

interface DashboardCommunitySnapshotCardProps {
	description: string
	stats: DashboardGeneralStats
}

export function DashboardCommunitySnapshotCard({ description, stats }: DashboardCommunitySnapshotCardProps) {
	const { totalConferences, totalPapers, totalReviewers, totalAuthors, totalOrganizers, totalUsers } = stats

	return (
		<Card>
			<CardHeader>
				<CardTitle>Community snapshot</CardTitle>
				<CardDescription>{description}</CardDescription>
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
	)
}
