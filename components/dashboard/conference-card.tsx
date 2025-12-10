'use client'

import { Calendar, Download, MapPin, Pencil, Trash2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger
} from '@/components/ui/dialog'
import { getReviewerStatusLabel } from '@/lib/reviewer/status'
import { type ConferenceInput } from '@/lib/validation/schemas'
import { ConferenceForm } from './conference-form'

// Interfaces (copied from page.tsx for now, ideally should be shared)
export interface ReviewerSummary {
	id: string
	name: string
	status: 'pending' | 'accepted' | 'declined'
}

export interface ConferencePaper {
	id: string
	title: string
	createdAt: string | null
	reviewers: ReviewerSummary[]
	file: { downloadUrl: string | null } | null
}

export interface OrganizerConference {
	id: string
	name: string
	description?: string
	location?: string
	startDate: string | null
	endDate: string | null
	papers: ConferencePaper[]
}

export interface ReviewerOption {
	id: string
	name: string
}

interface ConferenceCardProps {
	conference: OrganizerConference
	reviewers: ReviewerOption[]
	onUpdate: (conference: OrganizerConference) => void
	onDelete: (conferenceId: string) => void
}

export function ConferenceCard({ conference, reviewers, onUpdate, onDelete }: ConferenceCardProps) {
	const [isEditOpen, setIsEditOpen] = useState(false)
	const [isAssignOpen, setIsAssignOpen] = useState(false)

	const handleEditSubmit = async (data: ConferenceInput) => {
		try {
			const res = await fetch(`/api/conferences/${conference.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...data,
					startDate: data.startDate.toISOString(),
					endDate: data.endDate.toISOString()
				})
			})

			if (!res.ok) throw new Error('Failed to update')

			const updated = await res.json()
			// Merge the updated fields with existing conference data (to keep papers)
			onUpdate({
				...conference,
				...updated,
				papers: conference.papers // Preserve papers as the API might not return them or we want to keep current state
			})
			setIsEditOpen(false)
			toast.success('Conference updated')
		} catch {
			toast.error('Failed to update conference')
		}
	}

	const handleDelete = async () => {
		try {
			const res = await fetch(`/api/conferences/${conference.id}`, {
				method: 'DELETE'
			})

			if (!res.ok) throw new Error('Failed to delete')

			onDelete(conference.id)
			toast.success('Conference deleted')
		} catch {
			toast.error('Failed to delete conference')
		}
	}

	return (
		<Card className='overflow-hidden'>
			<div className='flex items-stretch'>
				{/* Status Indicator Bar */}
				<div className='w-1.5 bg-primary' />

				<div className='flex-1'>
					<CardHeader className='pb-4'>
						<div className='flex items-start justify-between gap-4'>
							<div className='space-y-2'>
								<CardTitle className='text-xl'>{conference.name}</CardTitle>
								<div className='flex items-center gap-2 text-sm text-muted-foreground'>
									{conference.location && (
										<span className='flex items-center gap-1'>
											<MapPin className='h-3 w-3' />
											{conference.location}
										</span>
									)}
								</div>
							</div>
							<div className='flex items-center gap-3'>
								<span className='inline-flex items-center rounded-md px-3 py-1.5 text-sm font-semibold bg-primary/10 text-primary'>
									{conference.papers.length} Papers
								</span>

								<div className='flex items-center gap-2'>
									<Dialog
										open={isAssignOpen}
										onOpenChange={setIsAssignOpen}
									>
										<DialogTrigger asChild>
											<Button
												variant='outline'
												size='sm'
											>
												<UserPlus className='mr-2 h-4 w-4' />
												Assign
											</Button>
										</DialogTrigger>
										<DialogContent className='max-w-4xl max-h-[80vh] overflow-y-auto'>
											<DialogHeader>
												<DialogTitle>Manage Assignments</DialogTitle>
												<DialogDescription>Assign reviewers to papers for {conference.name}</DialogDescription>
											</DialogHeader>
											<AssignmentsTable
												papers={conference.papers}
												reviewers={reviewers}
												onUpdatePapers={(updatedPapers) => onUpdate({ ...conference, papers: updatedPapers })}
											/>
										</DialogContent>
									</Dialog>

									<Dialog
										open={isEditOpen}
										onOpenChange={setIsEditOpen}
									>
										<DialogTrigger asChild>
											<Button
												variant='outline'
												size='sm'
											>
												<Pencil className='mr-2 h-4 w-4' />
												Edit
											</Button>
										</DialogTrigger>
										<DialogContent>
											<DialogHeader>
												<DialogTitle>Edit Conference</DialogTitle>
											</DialogHeader>
											<ConferenceForm
												defaultValues={{
													name: conference.name,
													description: conference.description || '',
													location: conference.location || '',
													startDate: conference.startDate ? new Date(conference.startDate) : undefined,
													endDate: conference.endDate ? new Date(conference.endDate) : undefined
												}}
												onSubmit={handleEditSubmit}
												submitLabel='Save Changes'
											/>
										</DialogContent>
									</Dialog>

									<AlertDialog>
										<AlertDialogTrigger asChild>
											<Button
												variant='destructive'
												size='sm'
											>
												<Trash2 className='mr-2 h-4 w-4' />
												Delete
											</Button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>Are you sure?</AlertDialogTitle>
												<AlertDialogDescription>
													This action cannot be undone. This will permanently delete the conference and all associated
													papers.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</div>
							</div>
						</div>
					</CardHeader>

					<CardContent className='pt-0 pb-6'>
						{/* Actions Row */}
						<div className='flex items-center gap-4 mb-6'>
							{conference.startDate && (
								<div className='inline-flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm font-medium'>
									<Calendar className='h-4 w-4' />
									{new Date(conference.startDate).toLocaleDateString()}
									{conference.endDate && ` - ${new Date(conference.endDate).toLocaleDateString()}`}
								</div>
							)}
						</div>

						{/* Description Section */}
						<div className='rounded-lg border bg-card'>
							<div className='flex items-center gap-2 px-4 py-3 border-b bg-muted/30'>
								<span className='text-sm font-medium'>Description</span>
							</div>
							<div className='px-4 py-4'>
								<p className='text-sm text-muted-foreground'>{conference.description || 'No description provided.'}</p>
							</div>
						</div>
					</CardContent>
				</div>
			</div>
		</Card>
	)
}

function AssignmentsTable({
	papers,
	reviewers,
	onUpdatePapers
}: {
	papers: ConferencePaper[]
	reviewers: ReviewerOption[]
	onUpdatePapers: (papers: ConferencePaper[]) => void
}) {
	const [assigningPaper, setAssigningPaper] = useState<string | null>(null)
	const [selectedReviewers, setSelectedReviewers] = useState<string[]>([])
	const [saving, setSaving] = useState(false)

	const startAssigning = (paper: ConferencePaper) => {
		setAssigningPaper(paper.id)
		setSelectedReviewers(paper.reviewers.map((r) => r.id))
	}

	const toggleReviewer = (reviewerId: string) => {
		setSelectedReviewers((prev) =>
			prev.includes(reviewerId) ? prev.filter((id) => id !== reviewerId) : [...prev, reviewerId]
		)
	}

	const saveAssignments = async (paperId: string) => {
		if (selectedReviewers.length === 0) {
			toast.error('Select at least one reviewer')
			return
		}

		setSaving(true)
		try {
			const res = await fetch('/api/papers', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ paperId, reviewerIds: selectedReviewers })
			})
			if (!res.ok) throw new Error()

			// Update local state
			const updatedPapers = papers.map((p) => {
				if (p.id !== paperId) return p
				return {
					...p,
					reviewers: selectedReviewers.map((id) => {
						const existing = p.reviewers.find((r) => r.id === id)
						if (existing) return existing
						const reviewer = reviewers.find((r) => r.id === id)
						return { id, name: reviewer?.name || 'Reviewer', status: 'pending' as const }
					})
				}
			})

			onUpdatePapers(updatedPapers)
			toast.success('Reviewers updated')
			setAssigningPaper(null)
		} catch {
			toast.error('Failed to save')
		} finally {
			setSaving(false)
		}
	}

	if (papers.length === 0) {
		return <p className='text-sm text-muted-foreground'>No papers submitted yet.</p>
	}

	return (
		<div className='space-y-4'>
			<div className='overflow-x-auto'>
				<table className='w-full text-sm'>
					<thead>
						<tr className='border-b text-left'>
							<th className='pb-2 font-medium'>Paper</th>
							<th className='pb-2 font-medium'>Reviewers</th>
							<th className='pb-2 font-medium'>Actions</th>
						</tr>
					</thead>
					<tbody>
						{papers.map((paper) => (
							<tr
								key={paper.id}
								className='border-b last:border-0'
							>
								<td className='py-3 pr-4'>
									<div className='font-medium'>{paper.title}</div>
									<div className='text-xs text-muted-foreground'>
										{paper.createdAt ? new Date(paper.createdAt).toLocaleDateString() : '-'}
									</div>
								</td>
								<td className='py-3 pr-4'>
									{paper.reviewers.length === 0 ? (
										<span className='text-muted-foreground'>None</span>
									) : (
										<div className='flex flex-wrap gap-1'>
											{paper.reviewers.map((r) => (
												<span
													key={r.id}
													className='inline-flex items-center rounded bg-muted px-2 py-0.5 text-xs'
												>
													{r.name}
													<span className='ml-1 text-muted-foreground'>({getReviewerStatusLabel(r.status)})</span>
												</span>
											))}
										</div>
									)}
								</td>
								<td className='py-3'>
									<div className='flex items-center gap-2'>
										{paper.file?.downloadUrl && (
											<Button
												variant='ghost'
												size='icon'
												asChild
											>
												<a
													href={paper.file.downloadUrl}
													target='_blank'
													rel='noopener noreferrer'
												>
													<Download className='h-4 w-4' />
												</a>
											</Button>
										)}
										<Button
											variant='outline'
											size='sm'
											onClick={() => startAssigning(paper)}
										>
											Assign
										</Button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{assigningPaper && (
				<div className='rounded-lg border p-4 bg-muted/50'>
					<h4 className='mb-3 font-medium'>Assign Reviewers for selected paper</h4>
					{reviewers.length === 0 ? (
						<p className='text-sm text-muted-foreground'>No reviewers available.</p>
					) : (
						<div className='space-y-2'>
							<div className='grid grid-cols-2 gap-2'>
								{reviewers.map((r) => (
									<label
										key={r.id}
										className='flex items-center gap-2 text-sm cursor-pointer'
									>
										<Checkbox
											checked={selectedReviewers.includes(r.id)}
											onCheckedChange={() => toggleReviewer(r.id)}
										/>
										{r.name}
									</label>
								))}
							</div>
							<div className='mt-4 flex gap-2'>
								<Button
									size='sm'
									disabled={saving}
									onClick={() => saveAssignments(assigningPaper)}
								>
									{saving ? 'Saving...' : 'Save Assignments'}
								</Button>
								<Button
									variant='ghost'
									size='sm'
									onClick={() => setAssigningPaper(null)}
								>
									Cancel
								</Button>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	)
}
