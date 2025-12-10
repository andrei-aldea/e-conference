'use client'

import { ExternalLink, FileText, Loader, Pencil, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { getReviewerStatusLabel, getReviewerStatusToneClass, summarizeReviewerDecisions } from '@/lib/reviewer/status'
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
	reviewers: Array<{ id: string; name: string; status: ReviewerDecision; feedback: string | null }>
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
	const { data: session } = useSession()
	const user = session?.user
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

			if (!silent) setIsLoading(true)
			setError(null)

			try {
				const response = await fetch('/api/papers?scope=self')
				if (!response.ok) throw new Error('Failed to load papers.')
				const payload = (await response.json()) as { papers: PaperItem[] }
				setPapers(payload.papers)
			} catch (err) {
				console.error('Failed to fetch papers:', err)
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
		setEditState({ paperId: paper.id, originalTitle: paper.title, title: paper.title, file: null })
		setUpdateError(null)
	}

	function closeEditDialog() {
		setEditState(null)
		setUpdateError(null)
	}

	async function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		if (!editState) return

		const trimmedTitle = editState.title.trim()
		const titleChanged = trimmedTitle.length > 0 && trimmedTitle !== editState.originalTitle.trim()
		const hasNewFile = Boolean(editState.file)

		if (!titleChanged && !hasNewFile) {
			setUpdateError('Edit the title or upload a new file before saving.')
			return
		}

		const formData = new FormData()
		formData.append('paperId', editState.paperId)
		if (titleChanged) formData.append('title', trimmedTitle)
		if (editState.file) formData.append('file', editState.file)

		setIsSubmittingUpdate(true)
		setUpdateError(null)

		try {
			const response = await fetch('/api/papers', { method: 'PUT', body: formData })
			if (!response.ok) {
				const payload = await response.json().catch(() => ({}))
				throw new Error(payload?.error || 'Failed to edit paper.')
			}

			toast.success('Paper updated successfully.')
			closeEditDialog()
			await loadPapers({ silent: true })
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to edit paper.'
			setUpdateError(message)
			toast.error(message)
		} finally {
			setIsSubmittingUpdate(false)
		}
	}

	if (!user) {
		return (
			<div className='flex flex-col items-center justify-center py-16 text-center'>
				<FileText className='h-12 w-12 text-muted-foreground mb-4' />
				<h2 className='text-xl font-semibold'>Sign in required</h2>
				<p className='text-muted-foreground mt-2'>You must be logged in to view your papers.</p>
			</div>
		)
	}

	if (user.role !== 'author') {
		return (
			<div className='flex flex-col items-center justify-center py-16 text-center'>
				<FileText className='h-12 w-12 text-muted-foreground mb-4' />
				<h2 className='text-xl font-semibold'>Authors Only</h2>
				<p className='text-muted-foreground mt-2'>Only authors can view submitted papers.</p>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>My Papers</h1>
					<p className='text-muted-foreground'>View your submitted papers and reviewer feedback.</p>
				</div>
				<Button asChild>
					<Link href='/dashboard/submit-paper'>Submit New Paper</Link>
				</Button>
			</div>

			{isLoading ? (
				<div className='grid gap-4'>
					{[1, 2, 3].map((i) => (
						<Card key={i}>
							<CardHeader>
								<Skeleton className='h-6 w-48' />
								<Skeleton className='h-4 w-32' />
							</CardHeader>
							<CardContent>
								<Skeleton className='h-4 w-full' />
							</CardContent>
						</Card>
					))}
				</div>
			) : error ? (
				<Card className='border-destructive/50'>
					<CardContent className='py-8 text-center'>
						<p className='text-destructive'>{error}</p>
						<Button
							variant='outline'
							className='mt-4'
							onClick={() => loadPapers()}
						>
							Try Again
						</Button>
					</CardContent>
				</Card>
			) : papers.length === 0 ? (
				<Card>
					<CardContent className='flex flex-col items-center py-16 text-center'>
						<FileText className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-medium'>No papers yet</h3>
						<p className='text-muted-foreground mt-2 mb-4'>You haven&apos;t submitted any papers.</p>
						<Button asChild>
							<Link href='/dashboard/submit-paper'>Submit Your First Paper</Link>
						</Button>
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-6'>
					{papers.map((paper) => {
						const decision = summarizeReviewerDecisions(paper.reviewers.map((r) => r.status))

						return (
							<Card
								key={paper.id}
								className='overflow-hidden'
							>
								{/* Paper Header */}
								<div className='flex items-stretch'>
									{/* Status Indicator Bar */}
									<div
										className={`w-1.5 ${
											decision === 'accepted'
												? 'bg-primary'
												: decision === 'declined'
												? 'bg-destructive'
												: 'bg-muted-foreground'
										}`}
									/>

									<div className='flex-1'>
										<CardHeader className='pb-4'>
											<div className='flex items-start justify-between gap-4'>
												<div className='space-y-2'>
													<CardTitle className='text-xl'>{paper.title}</CardTitle>
													{paper.conference && (
														<CardDescription className='text-sm'>{paper.conference.name}</CardDescription>
													)}
												</div>
												<div className='flex items-center gap-3'>
													{/* Status Badge */}
													<span
														className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold ${getReviewerStatusToneClass(
															decision
														)}`}
													>
														{getReviewerStatusLabel(decision)}
													</span>
													<Button
														size='sm'
														variant='outline'
														onClick={() => startEditingPaper(paper)}
													>
														<Pencil className='h-4 w-4 mr-1.5' />
														Edit
													</Button>
												</div>
											</div>
										</CardHeader>

										<CardContent className='pt-0 pb-6'>
											{/* Actions Row */}
											<div className='flex items-center gap-4 mb-6'>
												{paper.file?.downloadUrl && (
													<a
														href={paper.file.downloadUrl}
														target='_blank'
														rel='noopener noreferrer'
														className='inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium hover:bg-muted/80 transition-colors'
													>
														<FileText className='h-4 w-4' />
														View PDF
														<ExternalLink className='h-3 w-3' />
													</a>
												)}
											</div>

											{/* Reviewers Section */}
											<div className='rounded-lg border bg-card'>
												<div className='flex items-center gap-2 px-4 py-3 border-b bg-muted/30'>
													<Users className='h-4 w-4 text-muted-foreground' />
													<span className='text-sm font-medium'>Assigned Reviewers ({paper.reviewers.length})</span>
												</div>

												{paper.reviewers.length === 0 ? (
													<div className='px-4 py-6 text-center'>
														<p className='text-sm text-muted-foreground'>No reviewers assigned yet.</p>
													</div>
												) : (
													<div className='divide-y'>
														{paper.reviewers.map((reviewer) => (
															<div
																key={reviewer.id}
																className='px-4 py-4'
															>
																<div className='flex items-center justify-between mb-2'>
																	<span className='font-medium'>{reviewer.name}</span>
																	<span
																		className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${getReviewerStatusToneClass(
																			reviewer.status
																		)}`}
																	>
																		{getReviewerStatusLabel(reviewer.status)}
																	</span>
																</div>
																{reviewer.feedback ? (
																	<p className='text-sm text-muted-foreground'>{reviewer.feedback}</p>
																) : (
																	<p className='text-sm text-muted-foreground italic'>Awaiting feedback...</p>
																)}
															</div>
														))}
													</div>
												)}
											</div>
										</CardContent>
									</div>
								</div>
							</Card>
						)
					})}
				</div>
			)}

			{/* Edit Paper Dialog */}
			<Sheet
				open={editState !== null}
				onOpenChange={(open) => !open && closeEditDialog()}
			>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Edit Paper</SheetTitle>
						<SheetDescription>Update your paper title or upload a new version.</SheetDescription>
					</SheetHeader>

					{editState && (
						<form
							onSubmit={handleUpdateSubmit}
							className='flex-1 flex flex-col'
						>
							<div className='flex-1 space-y-6 px-4 py-6'>
								<div className='space-y-2'>
									<Label htmlFor='paper-title'>Title</Label>
									<Input
										id='paper-title'
										value={editState.title}
										onChange={(e) => setEditState((s) => (s ? { ...s, title: e.target.value } : s))}
										placeholder='Enter paper title'
									/>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='paper-file'>Upload New File (PDF)</Label>
									<Input
										id='paper-file'
										type='file'
										accept='.pdf,application/pdf'
										onChange={(e) => {
											const file = e.target.files?.[0] ?? null
											setEditState((s) => (s ? { ...s, file } : s))
										}}
									/>
									{editState.file && <p className='text-xs text-muted-foreground'>Selected: {editState.file.name}</p>}
								</div>

								{updateError && <p className='text-sm text-destructive'>{updateError}</p>}
							</div>

							<SheetFooter>
								<Button
									type='button'
									variant='outline'
									onClick={closeEditDialog}
									disabled={isSubmittingUpdate}
								>
									Cancel
								</Button>
								<Button
									type='submit'
									disabled={isSubmittingUpdate}
								>
									{isSubmittingUpdate && <Loader className='mr-2 h-4 w-4 animate-spin' />}
									Save Changes
								</Button>
							</SheetFooter>
						</form>
					)}
				</SheetContent>
			</Sheet>
		</div>
	)
}
