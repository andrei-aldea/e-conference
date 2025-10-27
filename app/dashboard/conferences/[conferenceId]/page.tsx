'use client'

import { format } from 'date-fns'
import { doc, type Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDocument } from 'react-firebase-hooks/firestore'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import type { Conference } from '@/lib/schemas'

export default function ConferenceDetailsPage() {
	const params = useParams<{ conferenceId: string }>()
	const conferenceId = params?.conferenceId

	const conferenceRef = conferenceId ? doc(db, 'conferences', conferenceId) : null
	const [snapshot, loading, error] = useDocument(conferenceRef)

	if (!conferenceId) {
		return <p>Invalid conference identifier.</p>
	}

	if (loading) {
		return <p>Loading conference...</p>
	}

	if (error) {
		return <p>Error: {error.message}</p>
	}

	if (!snapshot || !snapshot.exists()) {
		return <p>Conference not found.</p>
	}

	const data = snapshot.data() as Omit<Conference, 'startDate' | 'endDate'> & {
		startDate: Timestamp
		endDate: Timestamp
		organizerId?: string
	}

	const conference: Conference & { organizerId?: string } = {
		...data,
		id: snapshot.id,
		startDate: data.startDate.toDate(),
		endDate: data.endDate.toDate()
	}

	return (
		<>
			<div className='mb-6 flex items-center justify-between gap-4'>
				<h1 className='text-2xl font-semibold'>Conference details</h1>
				<Button
					variant='outline'
					asChild
				>
					<Link href='/dashboard/conferences'>Back to conferences</Link>
				</Button>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{conference.name}</CardTitle>
					<CardDescription>
						{conference.location} ({format(conference.startDate, 'PPP')} - {format(conference.endDate, 'PPP')})
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-6'>
						<section>
							<h2 className='text-sm font-medium uppercase text-muted-foreground'>Overview</h2>
							<p className='mt-2 leading-relaxed'>{conference.description}</p>
						</section>
						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='rounded-lg border p-4'>
								<p className='text-xs font-medium uppercase text-muted-foreground'>Start date</p>
								<p className='mt-1 text-sm font-semibold'>{format(conference.startDate, 'PPPP p')}</p>
							</div>
							<div className='rounded-lg border p-4'>
								<p className='text-xs font-medium uppercase text-muted-foreground'>End date</p>
								<p className='mt-1 text-sm font-semibold'>{format(conference.endDate, 'PPPP p')}</p>
							</div>
						</div>
						<div className='rounded-lg border p-4'>
							<p className='text-xs font-medium uppercase text-muted-foreground'>Organizer</p>
							<p className='mt-1 text-sm font-semibold'>{conference.organizerId ?? 'N/A'}</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
