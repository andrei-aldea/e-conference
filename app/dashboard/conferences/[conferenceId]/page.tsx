'use client'

import { format } from 'date-fns'
import { deleteDoc, doc, type Timestamp } from 'firebase/firestore'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useDocument } from 'react-firebase-hooks/firestore'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import type { Conference } from '@/lib/schemas'

export default function ConferenceDetailsPage() {
	const params = useParams<{ conferenceId: string }>()
	const conferenceId = params?.conferenceId
	const { user } = useAuth()
	const router = useRouter()

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

	const isOrganizer = user?.role === 'organizer'
	const isAuthor = user?.role === 'author'

	function handleDelete() {
		if (!conferenceId || !conferenceRef) {
			return
		}

		toast.error('Are you sure you want to delete this conference?', {
			action: {
				label: 'Delete',
				onClick: async () => {
					try {
						await deleteDoc(conferenceRef)
						toast.success('Conference deleted successfully!')
						router.push('/dashboard/conferences')
					} catch (e) {
						console.error('Error deleting conference: ', e)
						toast.error('There was an error deleting the conference.')
					}
				}
			}
		})
	}

	return (
		<>
			<div>
				<h1>Conference details</h1>
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
				{(isOrganizer || isAuthor) && (
					<CardFooter className='flex flex-wrap justify-between gap-4'>
						<Button
							variant='secondary'
							asChild
						>
							<Link href='/dashboard/conferences'>Back to conferences</Link>
						</Button>
						<div className='flex flex-wrap gap-4'>
							{isAuthor && (
								<Button
									variant='outline'
									asChild
								>
									<Link href={`/dashboard/conferences/${conference.id}/submit-paper`}>Submit paper</Link>
								</Button>
							)}
							{isOrganizer && (
								<Button
									variant='outline'
									asChild
								>
									<Link href={`/dashboard/conferences/${conference.id}/assign-reviewers`}>Assign reviewers</Link>
								</Button>
							)}
							{isOrganizer && (
								<Button
									variant='destructive'
									onClick={handleDelete}
								>
									Delete conference
								</Button>
							)}
						</div>
					</CardFooter>
				)}
			</Card>
		</>
	)
}
