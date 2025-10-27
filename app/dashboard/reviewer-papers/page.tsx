'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface ReviewerAssignment {
	id: string
	title: string
	createdAt: string | null
	author: {
		id: string
		name: string
	}
	conference: {
		id: string
		name: string
	}
}

export default function ReviewerPapersPage() {
	const { user } = useAuth()
	const [assignments, setAssignments] = useState<ReviewerAssignment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	useEffect(() => {
		async function loadAssignments() {
			if (!user || user.role !== 'reviewer') {
				setAssignments([])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch('/api/submissions?scope=reviewer')
				if (!response.ok) {
					throw new Error('Unable to load assigned papers.')
				}
				const payload = (await response.json()) as { submissions: ReviewerAssignment[] }
				setAssignments(payload.submissions)
			} catch (error) {
				console.error('Failed to fetch reviewer assignments:', error)
				setError('Unable to load your assigned papers right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadAssignments()
	}, [user])

	const content = useMemo(() => {
		if (!user) {
			return <p>You must be logged in to view your assigned papers.</p>
		}

		if (user.role !== 'reviewer') {
			return <p>Only reviewers can view assigned papers.</p>
		}

		if (isLoading) {
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

		if (assignments.length === 0) {
			return <p>You have not been assigned any papers yet.</p>
		}

		return (
			<div className='space-y-4'>
				{assignments.map((assignment) => (
					<Card key={assignment.id}>
						<CardHeader>
							<CardTitle>{assignment.title}</CardTitle>
							<CardDescription className='flex flex-col gap-1 text-xs sm:text-sm sm:flex-row sm:items-center sm:justify-between'>
								<span>Conference: {assignment.conference.name}</span>
								{assignment.createdAt && <span>Assigned {new Date(assignment.createdAt).toLocaleString()}</span>}
							</CardDescription>
						</CardHeader>
						<CardContent className='space-y-3 text-sm text-muted-foreground'>
							<div>
								<strong className='font-medium text-foreground'>Author:</strong> {assignment.author.name}
							</div>
							<p>Additional manuscript details will appear here once the upload workflow is implemented.</p>
						</CardContent>
					</Card>
				))}
			</div>
		)
	}, [user, isLoading, error, assignments])

	return (
		<div className='space-y-6'>
			<header className='space-y-1'>
				<h1 className='text-2xl font-semibold tracking-tight'>Assigned Papers</h1>
				<p className='text-sm text-muted-foreground'>Keep track of the submissions you are expected to review.</p>
			</header>
			{content}
		</div>
	)
}
