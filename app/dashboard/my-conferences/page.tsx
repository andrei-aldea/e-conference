'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { deleteDoc, doc } from 'firebase/firestore'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { db } from '@/lib/firebase'

interface ReviewerSummary {
	id: string
	name: string
}

interface ConferenceSubmission {
	id: string
	title: string
	createdAt: string | null
	reviewers: ReviewerSummary[]
}

interface OrganizerConference {
	id: string
	name: string
	description?: string
	location?: string
	startDate: string | null
	endDate: string | null
	submissions: ConferenceSubmission[]
}

export default function MyConferencesPage() {
	const { user } = useAuth()
	const [conferences, setConferences] = useState<OrganizerConference[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [deletingId, setDeletingId] = useState<string | null>(null)

	const handleDeleteConference = useCallback(
		(conferenceId: string) => {
			if (!user || user.role !== 'organizer') {
				return
			}

			toast.error('Delete this conference?', {
				description: 'This action cannot be undone.',
				action: {
					label: 'Delete',
					onClick: async () => {
						setDeletingId(conferenceId)
						try {
							await deleteDoc(doc(db, 'conferences', conferenceId))
							setConferences((prev) => prev.filter((conf) => conf.id !== conferenceId))
							toast.success('Conference deleted successfully.')
						} catch (deleteError) {
							console.error('Failed to delete conference:', deleteError)
							toast.error('There was an error deleting the conference.')
						} finally {
							setDeletingId((current) => (current === conferenceId ? null : current))
						}
					}
				}
			})
		},
		[user]
	)

	useEffect(() => {
		async function loadConferences() {
			if (!user || user.role !== 'organizer') {
				setConferences([])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch('/api/conferences?scope=organizer')
				if (!response.ok) {
					throw new Error('Unable to load conferences.')
				}
				const payload = (await response.json()) as { conferences: OrganizerConference[] }
				setConferences(payload.conferences)
			} catch (error) {
				console.error('Failed to load organizer conferences:', error)
				setError('Unable to load your conferences right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadConferences()
	}, [user])

	const content = useMemo(() => {
		if (!user) {
			return <p>You must be logged in to view your conferences.</p>
		}

		if (user.role !== 'organizer') {
			return <p>Only organizers can view created conferences.</p>
		}

		if (isLoading) {
			return (
				<div className='space-y-4'>
					{Array.from({ length: 2 }).map((_, index) => (
						<Card key={index}>
							<CardHeader className='space-y-2'>
								<Skeleton className='h-5 w-48' />
								<Skeleton className='h-4 w-32' />
							</CardHeader>
							<CardContent className='space-y-2'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-2/3' />
							</CardContent>
						</Card>
					))}
				</div>
			)
		}

		if (error) {
			return <p className='text-sm text-destructive'>{error}</p>
		}

		if (conferences.length === 0) {
			return <p>You have not created any conferences yet.</p>
		}

		return (
			<div className='space-y-4'>
				{conferences.map((conference) => (
					<Card key={conference.id}>
						<CardHeader className='space-y-4'>
							<div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
								<div className='space-y-1'>
									<CardTitle>{conference.name}</CardTitle>
									<CardDescription className='space-y-1 text-sm text-muted-foreground'>
										{conference.location && <span>{conference.location}</span>}
										{formatConferenceDates(conference.startDate, conference.endDate)}
									</CardDescription>
								</div>
								<Button
									variant='destructive'
									size='sm'
									onClick={() => handleDeleteConference(conference.id)}
									disabled={deletingId === conference.id}
								>
									{deletingId === conference.id ? 'Deleting...' : 'Delete'}
								</Button>
							</div>
						</CardHeader>
						<CardContent className='space-y-4'>
							{conference.description && <p className='text-sm text-muted-foreground'>{conference.description}</p>}
							<div>
								<h2 className='text-sm font-medium text-muted-foreground'>Submitted papers</h2>
								{conference.submissions.length === 0 ? (
									<p className='mt-2 text-sm'>No papers have been submitted to this conference yet.</p>
								) : (
									<ul className='mt-3 space-y-3'>
										{conference.submissions.map((submission) => (
											<li
												key={submission.id}
												className='rounded-lg border p-3'
											>
												<div className='flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between'>
													<span className='font-medium'>{submission.title}</span>
													{submission.createdAt && (
														<span className='text-xs text-muted-foreground'>
															Submitted {new Date(submission.createdAt).toLocaleString()}
														</span>
													)}
												</div>
												<div className='mt-2 text-sm text-muted-foreground'>
													<strong className='font-medium text-foreground'>Reviewers:</strong>{' '}
													{submission.reviewers.length > 0
														? submission.reviewers.map((reviewer) => reviewer.name).join(', ')
														: 'Not assigned yet'}
												</div>
											</li>
										))}
									</ul>
								)}
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}, [user, isLoading, error, conferences, deletingId, handleDeleteConference])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-2xl font-semibold tracking-tight'>My Conferences</h1>
				<p className='text-sm text-muted-foreground'>
					Track submissions and reviewer assignments across your conferences.
				</p>
			</header>
			{content}
		</div>
	)
}

function formatConferenceDates(startDate: string | null, endDate: string | null) {
	if (!startDate) {
		return 'Dates to be announced'
	}

	const formatter = new Intl.DateTimeFormat('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	})

	const start = formatter.format(new Date(startDate))

	if (!endDate) {
		return start
	}

	const end = formatter.format(new Date(endDate))
	return start === end ? start : `${start} - ${end}`
}
