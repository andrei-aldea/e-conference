'use client'

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { formatFileSize } from '@/lib/papers/constants'
import { getReviewerStatusLabel, getReviewerStatusToneClass } from '@/lib/reviewer/status'
import type { ReviewerDecision } from '@/lib/validation/schemas'

interface PaperFileDetails {
	name: string
	size: number | null
	contentType: string | null
	downloadUrl: string | null
	uploadedAt: string | null
}

interface PaperItem {
	id: string
	title: string
	conferenceId: string | null
	conference: { id: string; name: string } | null
	reviewers: Array<{ id: string; name: string; status: ReviewerDecision }>
	createdAt?: string
	file: PaperFileDetails | null
}

interface PaperEditState {
	paperId: string
	originalTitle: string
	title: string
	file: File | null
}

export default function MyPapersPage() {
	const { user } = useAuth()
	const [papers, setPapers] = useState<PaperItem[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editState, setEditState] = useState<PaperEditState | null>(null)
	const [updateError, setUpdateError] = useState<string | null>(null)
	const [isSubmittingUpdate, setIsSubmittingUpdate] = useState(false)

	const loadPapers = useCallback(
		async ({ silent = false }: { silent?: boolean } = {}) => {
			if (!user || user.role !== 'author') {
				setPapers([])
				setIsLoading(false)
				return
			}

			if (!silent) {
				setIsLoading(true)
			}
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
		},
		[user]
	)

	useEffect(() => {
		void loadPapers()
	}, [loadPapers])

	function startEditingPaper(paper: PaperItem) {
		setEditState({
			paperId: paper.id,
			originalTitle: paper.title,
			title: paper.title,
			file: null
		})
		setUpdateError(null)
	}

	function cancelEditing() {
		setEditState(null)
		setUpdateError(null)
	}

	async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!editState) {
			return
		}

		const trimmedTitle = editState.title.trim()
		const titleChanged = trimmedTitle.length > 0 && trimmedTitle !== editState.originalTitle.trim()
		const hasNewFile = Boolean(editState.file)

		if (!titleChanged && !hasNewFile) {
			setUpdateError('Update the title or upload a new manuscript before saving.')
			return
		}

		const formData = new FormData()
		formData.append('paperId', editState.paperId)
		if (titleChanged) {
			formData.append('title', trimmedTitle)
		}
		if (editState.file) {
			formData.append('file', editState.file)
		}

		setIsSubmittingUpdate(true)
		setUpdateError(null)

		try {
			const response = await fetch('/api/papers', {
				method: 'PUT',
				body: formData
			})
			if (!response.ok) {
				let message = 'Failed to update paper.'
				try {
					const payload = (await response.json()) as { error?: string }
					if (payload?.error) {
						message = payload.error
					}
				} catch (parseError) {
					console.error('Failed to parse paper update error response:', parseError)
				}
				throw new Error(message)
			}

			toast.success('Paper updated successfully.')
			setEditState(null)
			await loadPapers({ silent: true })
		} catch (submitError) {
			console.error('Failed to update paper:', submitError)
			const message = submitError instanceof Error ? submitError.message : 'Failed to update paper.'
			setUpdateError(message)
			toast.error(message)
		} finally {
			setIsSubmittingUpdate(false)
		}
	}

	let content: React.ReactNode

	if (!user) {
		content = <p>You must be logged in to view your papers.</p>
	} else if (user.role !== 'author') {
		content = <p>Only authors can view submitted papers.</p>
	} else if (isLoading) {
		content = (
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
	} else if (error) {
		content = <p className='text-sm text-destructive'>{error}</p>
	} else if (papers.length === 0) {
		content = <p>You have not submitted any papers yet.</p>
	} else {
		content = (
			<div className='space-y-4'>
				{papers.map((paper) => {
					const isEditing = editState?.paperId === paper.id

					return (
						<Card
							key={paper.id}
							className='border'
						>
							<CardHeader className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
								<div>
									<CardTitle>{paper.title}</CardTitle>
									{!!paper.createdAt && <CardDescription>{new Date(paper.createdAt).toLocaleString()}</CardDescription>}
								</div>
								<Button
									size='sm'
									variant={isEditing ? 'outline' : 'default'}
									onClick={() => (isEditing ? cancelEditing() : startEditingPaper(paper))}
									disabled={isEditing && isSubmittingUpdate}
								>
									{isEditing ? 'Close editor' : 'Update Paper'}
								</Button>
							</CardHeader>
							<CardContent className='space-y-4'>
								{paper.conference && (
									<div className='text-sm text-muted-foreground'>Conference: {paper.conference.name}</div>
								)}
								{paper.file ? (
									<div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
										<span className='font-medium text-foreground'>Manuscript:</span>
										{paper.file.downloadUrl ? (
											<Button
												variant='outline'
												size='sm'
												asChild
											>
												<a
													href={paper.file.downloadUrl}
													target='_blank'
													rel='noopener noreferrer'
												>
													Download PDF
												</a>
											</Button>
										) : (
											<span>No download link available.</span>
										)}
										{typeof paper.file.size === 'number' && paper.file.size > 0 && (
											<span>{formatFileSize(paper.file.size)}</span>
										)}
										{paper.file.uploadedAt && <span>Uploaded {new Date(paper.file.uploadedAt).toLocaleString()}</span>}
									</div>
								) : (
									<p className='text-sm text-muted-foreground'>No manuscript uploaded yet.</p>
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

								{isEditing && (
									<form
										onSubmit={handleUpdateSubmit}
										className='space-y-4 rounded-md border p-4'
									>
										<div className='space-y-2'>
											<Label htmlFor={`paper-title-${paper.id}`}>Title</Label>
											<Input
												id={`paper-title-${paper.id}`}
												value={editState.title}
												onChange={(event) =>
													setEditState((state) => (state ? { ...state, title: event.target.value } : state))
												}
												required={false}
											/>
										</div>
										<div className='space-y-2'>
											<Label htmlFor={`paper-file-${paper.id}`}>Upload new manuscript (PDF)</Label>
											<Input
												id={`paper-file-${paper.id}`}
												type='file'
												accept='application/pdf,.pdf'
												onChange={(event) => {
													const file = event.currentTarget.files?.[0] ?? null
													setEditState((state) => (state ? { ...state, file } : state))
												}}
											/>
											<p className='text-xs text-muted-foreground'>Only PDF files are supported.</p>
										</div>
										{updateError && <p className='text-sm text-destructive'>{updateError}</p>}
										<div className='flex flex-wrap items-center gap-2'>
											<Button
												type='submit'
												size='sm'
												disabled={isSubmittingUpdate}
											>
												{isSubmittingUpdate ? 'Saving…' : 'Save changes'}
											</Button>
											<Button
												type='button'
												variant='outline'
												size='sm'
												onClick={cancelEditing}
												disabled={isSubmittingUpdate}
											>
												Cancel
											</Button>
											{editState.file && (
												<span className='text-xs text-muted-foreground'>Selected: {editState.file.name}</span>
											)}
										</div>
									</form>
								)}
							</CardContent>
						</Card>
					)
				})}
			</div>
		)
	}

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
