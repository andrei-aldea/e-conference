'use client'

import { useMemo } from 'react'

import { collection, orderBy, query } from 'firebase/firestore'
import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/firebase'

interface ConferenceItem {
	id: string
	name: string
	description: string
	location: string
	startDate: Date | null
	endDate: Date | null
}

export default function ConferencesPage() {
	const [conferencesSnapshot, loading, error] = useCollection(
		query(collection(db, 'conferences'), orderBy('startDate', 'desc'))
	)

	const conferences = useMemo<ConferenceItem[]>(() => {
		if (!conferencesSnapshot) {
			return []
		}
		return conferencesSnapshot.docs.map((doc) => {
			const data = doc.data()
			return {
				id: doc.id,
				name: data.name as string,
				description: data.description as string,
				location: data.location as string,
				startDate: data.startDate?.toDate?.() ?? null,
				endDate: data.endDate?.toDate?.() ?? null
			}
		})
	}, [conferencesSnapshot])

	const content = useMemo(() => {
		if (loading) {
			return (
				<div className='space-y-4'>
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
			return <p className='text-sm text-destructive'>Failed to load conferences. Please try again.</p>
		}

		if (conferences.length === 0) {
			return <p>No conferences have been created yet.</p>
		}

		return (
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
								<Button
									variant='outline'
									size='sm'
									asChild
								>
									<Link href={`/dashboard/conferences/${conf.id}`}>View details</Link>
								</Button>
							</CardDescription>
						</CardHeader>
						{conf.description && (
							<CardContent>
								<p className='text-sm text-muted-foreground line-clamp-2'>{conf.description}</p>
							</CardContent>
						)}
					</Card>
				))}
			</div>
		)
	}, [loading, error, conferences])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-2xl font-semibold tracking-tight'>Conferences</h1>
				<p className='text-sm text-muted-foreground'>Browse all upcoming conferences and view their details.</p>
			</header>
			{content}
		</div>
	)
}

function formatConferenceDates(startDate: Date | null, endDate: Date | null) {
	if (!startDate) {
		return 'Dates to be announced'
	}

	const formatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})

	const start = formatter.format(startDate)

	if (!endDate) {
		return start
	}

	const end = formatter.format(endDate)
	return start === end ? start : `${start} - ${end}`
}
