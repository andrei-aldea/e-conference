'use client'

import { useEffect, useState } from 'react'

import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
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
			setLoading(true)
			setError(null)
			try {
				const res = await fetch('/api/conferences')
				if (!res.ok) throw new Error('Failed to load conferences')
				const data = await res.json()
				setConferences(data.conferences)
			} catch (err) {
				console.error(err)
				setError('Failed to load conferences.')
			} finally {
				setLoading(false)
			}
		}
		load()
	}, [])

	if (loading) {
		return (
			<div className='space-y-4'>
				<header className='space-y-1'>
					<PageTitle>Conferences</PageTitle>
					<PageDescription>Browse all upcoming conferences and view their details.</PageDescription>
				</header>
				{Array.from({ length: 3 }).map((_, index) => (
					<Card key={index}>
						<CardHeader className='space-y-2'>
							<Skeleton className='h-5 w-48' />
							<Skeleton className='h-4 w-32' />
						</CardHeader>
						<CardContent className='space-y-2'>
							<Skeleton className='h-4 w-full' />
							<Skeleton className='h-4 w-24' />
						</CardContent>
					</Card>
				))}
			</div>
		)
	}

	if (error) {
		return (
			<div className='space-y-6'>
				<header className='space-y-1'>
					<PageTitle>Conferences</PageTitle>
					<PageDescription>Browse all upcoming conferences and view their details.</PageDescription>
				</header>
				<p className='text-sm text-destructive'>{error}</p>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<PageTitle>Conferences</PageTitle>
				<PageDescription>Browse all upcoming conferences and view their details.</PageDescription>
			</header>

			{conferences.length === 0 ? (
				<p>No conferences have been created yet.</p>
			) : (
				<div className='space-y-4'>
					{conferences.map((conf) => (
						<Card key={conf.id}>
							<CardHeader>
								<CardTitle>{conf.name}</CardTitle>
								<CardDescription className='flex flex-col gap-1 text-xs sm:text-sm sm:flex-row sm:items-center sm:justify-between'>
									<span>
										{conf.location}
										{conf.startDate && ' · '}
										{formatConferenceDates(conf.startDate, conf.endDate)}
									</span>
								</CardDescription>
							</CardHeader>
							{conf.description && (
								<CardContent>
									<p className='text-sm text-muted-foreground line-clamp-2'>{conf.description}</p>
								</CardContent>
							)}
							<CardFooter>
								<Button
									variant='outline'
									size='sm'
									asChild
								>
									<Link href={`/dashboard/conferences/${conf.id}`}>View details</Link>
								</Button>
							</CardFooter>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}

function formatConferenceDates(startDate: string | null, endDate: string | null) {
	if (!startDate) {
		return 'Dates to be announced'
	}

	const startObj = new Date(startDate)
	const endObj = endDate ? new Date(endDate) : null

	const formatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})

	const start = formatter.format(startObj)

	if (!endObj) {
		return start
	}

	const end = formatter.format(endObj)
	return start === end ? start : `${start} - ${end}`
}
