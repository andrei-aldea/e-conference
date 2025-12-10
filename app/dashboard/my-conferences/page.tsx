'use client'

import { Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { ConferenceCard, type OrganizerConference, type ReviewerOption } from '@/components/dashboard/conference-card'
import { PageDescription, PageHeader, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function MyConferencesPage() {
	const { data: session } = useSession()
	const user = session?.user
	const [conferences, setConferences] = useState<OrganizerConference[]>([])
	const [reviewers, setReviewers] = useState<ReviewerOption[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function load() {
			if (!user || user.role !== 'organizer') {
				setIsLoading(false)
				return
			}

			try {
				const res = await fetch('/api/conferences?scope=organizer')
				if (!res.ok) throw new Error('Failed to load')
				const data = await res.json()
				const confs = data.conferences.map((c: OrganizerConference) => ({
					...c,
					papers: c.papers || []
				}))
				setConferences(confs)
				setReviewers(data.reviewers || [])
			} catch {
				setError('Failed to load conferences')
			} finally {
				setIsLoading(false)
			}
		}
		load()
	}, [user])

	const handleUpdate = (updatedConference: OrganizerConference) => {
		setConferences((prev) => prev.map((c) => (c.id === updatedConference.id ? updatedConference : c)))
	}

	const handleDelete = (conferenceId: string) => {
		setConferences((prev) => prev.filter((c) => c.id !== conferenceId))
	}

	if (!user) {
		return (
			<div>
				<PageHeader>
					<PageTitle>My Conferences</PageTitle>
				</PageHeader>
				<p className='text-muted-foreground'>Please log in to view your conferences.</p>
			</div>
		)
	}

	if (user.role !== 'organizer') {
		return (
			<div>
				<PageHeader>
					<PageTitle>My Conferences</PageTitle>
				</PageHeader>
				<p className='text-muted-foreground'>Only organizers can view this page.</p>
			</div>
		)
	}

	return (
		<div>
			<PageHeader>
				<div className='flex items-center justify-between'>
					<div>
						<PageTitle>My Conferences</PageTitle>
						<PageDescription>Manage your conferences and paper assignments.</PageDescription>
					</div>
					<Button asChild>
						<Link href='/dashboard/conferences/new'>
							<Plus className='mr-2 h-4 w-4' />
							New Conference
						</Link>
					</Button>
				</div>
			</PageHeader>

			{isLoading && (
				<div className='space-y-4'>
					{[1, 2].map((i) => (
						<Card key={i}>
							<CardContent className='p-6'>
								<Skeleton className='h-6 w-48 mb-4' />
								<Skeleton className='h-4 w-full' />
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{error && <p className='text-destructive'>{error}</p>}

			{!isLoading && !error && conferences.length === 0 && (
				<Card>
					<CardContent className='py-8 text-center'>
						<p className='text-muted-foreground'>You haven&apos;t created any conferences yet.</p>
						<Button
							asChild
							className='mt-4'
						>
							<Link href='/dashboard/conferences/new'>Create your first conference</Link>
						</Button>
					</CardContent>
				</Card>
			)}

			{!isLoading && !error && conferences.length > 0 && (
				<div className='space-y-4'>
					{conferences.map((conf) => (
						<ConferenceCard
							key={conf.id}
							conference={conf}
							reviewers={reviewers}
							onUpdate={handleUpdate}
							onDelete={handleDelete}
						/>
					))}
				</div>
			)}
		</div>
	)
}
