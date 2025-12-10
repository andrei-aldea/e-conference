'use client'

import { ExternalLink, FileText, Loader, Pencil, User, Waypoints } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
	getReviewerStatusLabel,
	getReviewerStatusToneClass,
	REVIEWER_DECISIONS,
	REVIEWER_FEEDBACK_MAX_LENGTH
} from '@/lib/reviewer/status'
import type { ReviewerDecision } from '@/lib/validation/schemas'

const STATUS_OPTIONS: Array<{ value: ReviewerDecision; label: string }> = REVIEWER_DECISIONS.map((value) => ({
	value,
	label: getReviewerStatusLabel(value)
}))

interface PaperFileDetails {
	name: string
	size: number | null
	contentType: string | null
	downloadUrl: string | null
	uploadedAt: string | null
}

interface ReviewerAssignment {
	id: string
	title: string
	createdAt: string | null
	author: { id: string; name: string }
	conference: { id: string; name: string }
	status: ReviewerDecision
	feedback: string | null
	file: PaperFileDetails | null
}

interface EditState {
	paperId: string
	status: ReviewerDecision
	feedback: string
}

export default function ReviewerPapersPage() {
	const { data: session } = useSession()
	const user = session?.user
	const [assignments, setAssignments] = useState<ReviewerAssignment[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [editState, setEditState] = useState<EditState | null>(null)
	const [isSaving, setIsSaving] = useState(false)
	const [saveError, setSaveError] = useState<string | null>(null)

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
				const response = await fetch('/api/papers?scope=reviewer')
				if (!response.ok) throw new Error('Unable to load assigned papers.')
				const payload = (await response.json()) as { papers: ReviewerAssignment[] }
				setAssignments(payload.papers)
			} catch (loadError) {
				console.error('Failed to fetch reviewer assignments:', loadError)
				setError('Unable to load your assigned papers right now. Please try again later.')
			} finally {
				setIsLoading(false)
			}
		}

		void loadAssignments()
	}, [user])

	const startEditing = useCallback((assignment: ReviewerAssignment) => {
		setEditState({
			paperId: assignment.id,
			status: assignment.status,
			feedback: assignment.feedback ?? ''
		})
		setSaveError(null)
	}, [])

	const closeDialog = useCallback(() => {
		setEditState(null)
		setSaveError(null)
	}, [])

	const handleSave = useCallback(async () => {
		if (!editState || !user || user.role !== 'reviewer') return

		setIsSaving(true)
		setSaveError(null)

		try {
			const response = await fetch('/api/papers', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					paperId: editState.paperId,
					status: editState.status,
					feedback: editState.feedback
				})
			})

			if (!response.ok) {
				const payload = await response.json().catch(() => ({}))
				throw new Error(payload?.error || 'Failed to save review')
			}

			setAssignments((prev) =>
				prev.map((a) =>
					a.id === editState.paperId
						? { ...a, status: editState.status, feedback: editState.feedback.trim() || null }
						: a
				)
			)

			toast.success('Review saved successfully')
			closeDialog()
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to save review'
			setSaveError(message)
			toast.error(message)
		} finally {
			setIsSaving(false)
		}
	}, [editState, user, closeDialog])

	if (!user) {
		return (
			<div className='flex flex-col items-center justify-center py-16 text-center'>
				<Waypoints className='h-12 w-12 text-muted-foreground mb-4' />
				<h2 className='text-xl font-semibold'>Sign in required</h2>
				<p className='text-muted-foreground mt-2'>You must be logged in to view assigned papers.</p>
			</div>
		)
	}

	if (user.role !== 'reviewer') {
		return (
			<div className='flex flex-col items-center justify-center py-16 text-center'>
				<Waypoints className='h-12 w-12 text-muted-foreground mb-4' />
				<h2 className='text-xl font-semibold'>Reviewers Only</h2>
				<p className='text-muted-foreground mt-2'>Only reviewers can view assigned papers.</p>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex items-center justify-between'>
				<div>
					<h1 className='text-2xl font-bold tracking-tight'>Assigned Papers</h1>
					<p className='text-muted-foreground'>Review papers assigned to you and provide feedback.</p>
				</div>
			</div>

			{isLoading ? (
				<div className='grid gap-6'>
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
					</CardContent>
				</Card>
			) : assignments.length === 0 ? (
				<Card>
					<CardContent className='flex flex-col items-center py-16 text-center'>
						<Waypoints className='h-12 w-12 text-muted-foreground mb-4' />
						<h3 className='text-lg font-medium'>No papers assigned</h3>
						<p className='text-muted-foreground mt-2'>You haven&apos;t been assigned any papers to review yet.</p>
					</CardContent>
				</Card>
			) : (
				<div className='grid gap-6'>
					{assignments.map((assignment) => (
						<Card
							key={assignment.id}
							className='overflow-hidden'
						>
							<div className='flex items-stretch'>
								{/* Status Indicator Bar */}
								<div
									className={`w-1.5 ${
										assignment.status === 'accepted'
											? 'bg-primary'
											: assignment.status === 'declined'
											? 'bg-destructive'
											: 'bg-muted-foreground'
									}`}
								/>

								<div className='flex-1'>
									<CardHeader className='pb-4'>
										<div className='flex items-start justify-between gap-4'>
											<div className='space-y-2'>
												<CardTitle className='text-xl'>{assignment.title}</CardTitle>
												<CardDescription className='text-sm'>{assignment.conference.name}</CardDescription>
											</div>
											<div className='flex items-center gap-3'>
												<span
													className={`inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold ${getReviewerStatusToneClass(
														assignment.status
													)}`}
												>
													{getReviewerStatusLabel(assignment.status)}
												</span>
												<Button
													size='sm'
													variant='outline'
													onClick={() => startEditing(assignment)}
												>
													<Pencil className='h-4 w-4 mr-1.5' />
													Review
												</Button>
											</div>
										</div>
									</CardHeader>

									<CardContent className='pt-0 pb-6'>
										{/* Actions Row */}
										<div className='flex items-center gap-4 mb-6'>
											<div className='inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium'>
												<User className='h-4 w-4' />
												{assignment.author.name}
											</div>
											{assignment.file?.downloadUrl && (
												<a
													href={assignment.file.downloadUrl}
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

										{/* Feedback Section */}
										<div className='rounded-lg border bg-card'>
											<div className='flex items-center gap-2 px-4 py-3 border-b bg-muted/30'>
												<span className='text-sm font-medium'>Your Feedback</span>
											</div>
											<div className='px-4 py-4'>
												{assignment.feedback ? (
													<p className='text-sm text-muted-foreground'>{assignment.feedback}</p>
												) : (
													<p className='text-sm text-muted-foreground italic'>No feedback submitted yet.</p>
												)}
											</div>
										</div>
									</CardContent>
								</div>
							</div>
						</Card>
					))}
				</div>
			)}

			{/* Review Dialog */}
			<Sheet
				open={editState !== null}
				onOpenChange={(open) => !open && closeDialog()}
			>
				<SheetContent>
					<SheetHeader>
						<SheetTitle>Submit Review</SheetTitle>
						<SheetDescription>Provide your decision and feedback for this paper.</SheetDescription>
					</SheetHeader>

					{editState && (
						<div className='flex-1 flex flex-col'>
							<div className='flex-1 space-y-6 px-4 py-6'>
								<div className='space-y-2'>
									<Label htmlFor='review-status'>Decision</Label>
									<Select
										value={editState.status}
										onValueChange={(value) =>
											setEditState((s) => (s ? { ...s, status: value as ReviewerDecision } : s))
										}
									>
										<SelectTrigger id='review-status'>
											<SelectValue />
										</SelectTrigger>
										<SelectContent>
											{STATUS_OPTIONS.map((option) => (
												<SelectItem
													key={option.value}
													value={option.value}
												>
													{option.label}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								<div className='space-y-2'>
									<Label htmlFor='review-feedback'>Feedback</Label>
									<Textarea
										id='review-feedback'
										value={editState.feedback}
										onChange={(e) => setEditState((s) => (s ? { ...s, feedback: e.target.value } : s))}
										maxLength={REVIEWER_FEEDBACK_MAX_LENGTH}
										rows={6}
										placeholder='Share constructive feedback for the author'
									/>
									<p className='text-xs text-muted-foreground'>
										{editState.feedback.length}/{REVIEWER_FEEDBACK_MAX_LENGTH} characters
									</p>
								</div>

								{saveError && <p className='text-sm text-destructive'>{saveError}</p>}
							</div>

							<SheetFooter>
								<Button
									type='button'
									variant='outline'
									onClick={closeDialog}
									disabled={isSaving}
								>
									Cancel
								</Button>
								<Button
									type='button'
									onClick={handleSave}
									disabled={isSaving}
								>
									{isSaving && <Loader className='mr-2 h-4 w-4 animate-spin' />}
									Save Review
								</Button>
							</SheetFooter>
						</div>
					)}
				</SheetContent>
			</Sheet>
		</div>
	)
}
