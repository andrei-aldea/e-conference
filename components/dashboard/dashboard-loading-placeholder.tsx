'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export function DashboardLoadingPlaceholder() {
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
