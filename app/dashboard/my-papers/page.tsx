'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth/auth-provider'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { getReviewerStatusLabel, getReviewerStatusToneClass } from '@/lib/reviewer/status'
import type { ReviewerDecision } from '@/lib/validation/schemas'

interface PaperItem {
	id: string
	title: string
	conferenceId: string | null
	conference: { id: string; name: string } | null
	reviewers: Array<{ id: string; name: string; status: ReviewerDecision }>
	createdAt?: string
}

export default function MyPapersPage() {
	const { user } = useAuth()
	const [papers, setPapers] = useState<PaperItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function loadPapers() {
			if (!user || user.role !== 'author') {
				setPapers([])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)
			try {
				const response = await fetch('/api/papers?scope=self')
				if (!response.ok) {
					throw new Error('Failed to load papers.')
				}
				const payload = (await response.json()) as { papers: PaperItem[] }
				setPapers(payload.papers)
			} catch (error) {
				console.error('Failed to fetch papers:', error)
				setError('Unable to load your papers right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadPapers()
	}, [user])

	const content = useMemo(() => {
		if (!user) {
			return <p>You must be logged in to view your papers.</p>
		}

		if (user.role !== 'author') {
			return <p>Only authors can view submitted papers.</p>
		}

		if (isLoading) {
			return (
				<div className='space-y-4'>
					{Array.from({ length: 3 }).map((_, index) => (
						<Card
							key={index}
							className='border'
						>
							<CardHeader className='space-y-2'>
								<Skeleton className='h-5 w-48' />
								<Skeleton className='h-4 w-32' />
							</CardHeader>
							<CardContent className='space-y-2'>
								<Skeleton className='h-4 w-full' />
								<Skeleton className='h-4 w-3/4' />
							</CardContent>
						</Card>
					))}
				</div>
			)
		}

		if (error) {
			return <p className='text-sm text-destructive'>{error}</p>
		}

		if (papers.length === 0) {
			return <p>You have not submitted any papers yet.</p>
		}

		return (
			<div className='space-y-4'>
				{papers.map((paper) => (
					<Card key={paper.id}>
						<CardHeader>
							<CardTitle>{paper.title}</CardTitle>
							{!!paper.createdAt && <CardDescription>{new Date(paper.createdAt).toLocaleString()}</CardDescription>}
						</CardHeader>
						<CardContent className='space-y-4'>
							{paper.conference && (
								<div className='text-sm text-muted-foreground'>Conference: {paper.conference.name}</div>
							)}
							<div>
								<h2 className='text-sm font-medium text-muted-foreground'>Assigned reviewers</h2>
								<ul className='mt-2 space-y-1'>
									{paper.reviewers.map((reviewer) => (
										<li
											key={reviewer.id}
											className='flex items-center justify-between gap-2 text-sm'
										>
											<span>{reviewer.name}</span>
											<span
												className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${getReviewerStatusToneClass(
													reviewer.status
												)}`}
											>
												{getReviewerStatusLabel(reviewer.status)}
											</span>
										</li>
									))}
								</ul>
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}, [user, papers, isLoading, error])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<PageTitle>My Papers</PageTitle>
				<PageDescription>Review your papers and see who is assigned to review them.</PageDescription>
			</header>
			{content}
		</div>
	)
}
