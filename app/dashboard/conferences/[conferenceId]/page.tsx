'use client'

import { format } from 'date-fns'
import { doc, type Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useDocument } from 'react-firebase-hooks/firestore'

import { PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/firebase/client'
import type { Conference } from '@/lib/validation/schemas'

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

	type FirestoreConference = Omit<Conference, 'startDate' | 'endDate'> & {
		startDate: Timestamp
		endDate: Timestamp
	}

	const data = snapshot.data() as FirestoreConference

	const conference: Conference = {
		...data,
		id: snapshot.id,
		startDate: data.startDate.toDate(),
		endDate: data.endDate.toDate()
	}

	return (
		<>
			<div>
				<PageTitle>Conference details</PageTitle>
			</div>
			<Card>
				<CardHeader>
					<CardTitle>{conference.name}</CardTitle>
					<CardDescription>{conference.location}</CardDescription>
				</CardHeader>
				<CardContent>
					<div className='space-y-6'>
						<section>
							<p>{conference.description}</p>
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
					</div>
				</CardContent>
				<CardFooter className='flex flex-wrap justify-between gap-4'>
					<Button
						variant='secondary'
						asChild
					>
						<Link href='/dashboard/conferences'>Back to conferences</Link>
					</Button>
				</CardFooter>
			</Card>
		</>
	)
}
