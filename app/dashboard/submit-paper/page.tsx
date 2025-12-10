'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { FileUp, Loader } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
	MANUSCRIPT_MAX_SIZE_BYTES,
	MANUSCRIPT_MAX_SIZE_LABEL,
	isAllowedManuscriptExtension,
	isAllowedManuscriptMimeType
} from '@/lib/papers/constants'
import { paperFormSchema, type PaperFormInput } from '@/lib/validation/schemas'

interface ConferenceOption {
	id: string
	name: string
}

export default function SubmitPaperPage() {
	const { data: session } = useSession()
	const user = session?.user
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoadingConferences, setIsLoadingConferences] = useState(true)
	const [conferences, setConferences] = useState<ConferenceOption[]>([])
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)

	const form = useForm<PaperFormInput>({
		resolver: zodResolver(paperFormSchema),
		defaultValues: { title: '', conferenceId: '' }
	})

	useEffect(() => {
		let isMounted = true
		async function loadConferences() {
			try {
				const response = await fetch('/api/conferences')
				if (!response.ok) throw new Error('Failed to load conferences')

				const data = await response.json()
				if (!isMounted) return

				const options = data.conferences.map((c: { id: string; name: string }) => ({
					id: c.id,
					name: c.name ?? 'Untitled conference'
				}))
				setConferences(options)
			} catch (error) {
				console.error('Failed to load conferences:', error)
				toast.error('Unable to load conferences.')
			} finally {
				if (isMounted) setIsLoadingConferences(false)
			}
		}

		void loadConferences()
		return () => {
			isMounted = false
		}
	}, [])

	async function onSubmit(data: PaperFormInput) {
		if (!user || user.role !== 'author') {
			toast.error('You must be an author to submit a paper.')
			return
		}

		if (!selectedFile) {
			setFileError('Please upload your manuscript as a PDF file.')
			return
		}

		const mimeAllowed = isAllowedManuscriptMimeType(selectedFile.type)
		const extensionAllowed = isAllowedManuscriptExtension(selectedFile.name)
		if (!mimeAllowed && !extensionAllowed) {
			setFileError('Only PDF manuscripts are supported.')
			return
		}

		if (selectedFile.size > MANUSCRIPT_MAX_SIZE_BYTES) {
			setFileError(`File must be ${MANUSCRIPT_MAX_SIZE_LABEL} or smaller.`)
			return
		}

		setFileError(null)
		setIsSubmitting(true)

		try {
			const payload = new FormData()
			payload.append('title', data.title)
			payload.append('conferenceId', data.conferenceId)
			payload.append('file', selectedFile)

			const response = await fetch('/api/papers', { method: 'POST', body: payload })

			if (!response.ok) {
				const err = await response.json().catch(() => ({}))
				throw new Error(err?.error || 'Failed to submit paper.')
			}

			toast.success('Paper submitted successfully!')
			form.reset({ title: '', conferenceId: '' })
			setSelectedFile(null)
			if (fileInputRef.current) fileInputRef.current.value = ''
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to submit paper.'
			toast.error(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!user || user.role !== 'author') {
		return (
			<div className='flex flex-col items-center justify-center py-16 text-center'>
				<FileUp className='h-12 w-12 text-muted-foreground mb-4' />
				<h2 className='text-xl font-semibold'>Authors Only</h2>
				<p className='text-muted-foreground mt-2'>Only authors can submit papers.</p>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div>
				<h1 className='text-2xl font-bold tracking-tight'>Submit Paper</h1>
				<p className='text-muted-foreground'>Upload your manuscript to a conference for review.</p>
			</div>

			<Card className='max-w-2xl'>
				<CardHeader>
					<CardTitle>Paper Details</CardTitle>
					<CardDescription>Fill in the information below to submit your paper.</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className='space-y-6'
						>
							<FormField
								control={form.control}
								name='conferenceId'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Conference</FormLabel>
										<Select
											disabled={isLoadingConferences || conferences.length === 0}
											onValueChange={field.onChange}
											value={field.value}
										>
											<SelectTrigger>
												<SelectValue placeholder={isLoadingConferences ? 'Loading...' : 'Select a conference'} />
											</SelectTrigger>
											<SelectContent>
												{conferences.map((conf) => (
													<SelectItem
														key={conf.id}
														value={conf.id}
													>
														{conf.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										{!isLoadingConferences && conferences.length === 0 && (
											<p className='text-sm text-muted-foreground'>No conferences available.</p>
										)}
										<FormMessage />
									</FormItem>
								)}
							/>

							<FormField
								control={form.control}
								name='title'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Paper Title</FormLabel>
										<FormControl>
											<Input
												placeholder='Enter your paper title'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>

							<div className='space-y-2'>
								<FormLabel>Manuscript (PDF)</FormLabel>
								<div className='rounded-lg border-2 border-dashed border-border p-6 text-center transition-colors hover:border-primary/50'>
									<FileUp className='mx-auto h-8 w-8 text-muted-foreground mb-2' />
									<Input
										type='file'
										accept='.pdf,application/pdf'
										ref={fileInputRef}
										className='hidden'
										id='manuscript-upload'
										onChange={(e) => {
											const file = e.target.files?.[0] ?? null
											setSelectedFile(file)
											setFileError(null)
										}}
									/>
									<label
										htmlFor='manuscript-upload'
										className='cursor-pointer text-sm text-primary hover:underline'
									>
										{selectedFile ? selectedFile.name : 'Click to upload PDF'}
									</label>
									<p className='text-xs text-muted-foreground mt-1'>Maximum size: {MANUSCRIPT_MAX_SIZE_LABEL}</p>
								</div>
								{fileError && <p className='text-sm text-destructive'>{fileError}</p>}
							</div>

							<Button
								type='submit'
								className='w-full'
								disabled={isSubmitting || isLoadingConferences || conferences.length === 0}
							>
								{isSubmitting && <Loader className='mr-2 h-4 w-4 animate-spin' />}
								Submit Paper
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
