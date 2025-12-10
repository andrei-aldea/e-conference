'use client'

import { useEffect, useState } from 'react'

import { PageDescription, PageHeader, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Calendar, MapPin } from 'lucide-react'
import Link from 'next/link'

interface ConferenceItem {
	id: string
	name: string
	description: string
	location: string
	startDate: string | null
	endDate: string | null
}

export default function ConferencesPage() {
	const [conferences, setConferences] = useState<ConferenceItem[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch('/api/conferences')
				if (!res.ok) throw new Error('Failed to load')
				const data = await res.json()
				setConferences(data.conferences)
			} catch {
				setError('Failed to load conferences.')
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	return (
		<div>
			<PageHeader>
				<PageTitle>Conferences</PageTitle>
				<PageDescription>Browse all conferences and their details.</PageDescription>
			</PageHeader>

			{loading && (
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
			)}

			{error && <p className='text-destructive'>{error}</p>}

			{!loading && !error && conferences.length === 0 && (
				<p className='text-muted-foreground'>No conferences available.</p>
			)}

			{!loading && !error && conferences.length > 0 && (
				<div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
					{conferences.map((conf) => (
						<Card
							key={conf.id}
							className='flex flex-col'
						>
							<CardHeader>
								<CardTitle className='text-lg'>{conf.name}</CardTitle>
							</CardHeader>
							<CardContent className='flex-1 space-y-3'>
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
								{conf.description && <p className='text-sm text-muted-foreground line-clamp-2'>{conf.description}</p>}
							</CardContent>
							<div className='p-6 pt-0'>
								<Button
									variant='outline'
									size='sm'
									asChild
									className='w-full'
								>
									<Link href={`/dashboard/conferences/${conf.id}`}>View details</Link>
								</Button>
							</div>
						</Card>
					))}
				</div>
			)}
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
