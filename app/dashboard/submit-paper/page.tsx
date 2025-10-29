'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { Loader } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { db } from '@/lib/firebase/client'
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
	const { user } = useAuth()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [isLoadingConferences, setIsLoadingConferences] = useState(true)
	const [conferences, setConferences] = useState<ConferenceOption[]>([])
	const fileInputRef = useRef<HTMLInputElement | null>(null)
	const [selectedFile, setSelectedFile] = useState<File | null>(null)
	const [fileError, setFileError] = useState<string | null>(null)

	const form = useForm<PaperFormInput>({
		resolver: zodResolver(paperFormSchema),
		defaultValues: {
			title: '',
			conferenceId: ''
		}
	})

	useEffect(() => {
		let isMounted = true
		async function loadConferences() {
			try {
				const snapshot = await getDocs(query(collection(db, 'conferences'), orderBy('startDate', 'desc')))
				if (!isMounted) {
					return
				}
				const options = snapshot.docs.map((doc) => ({
					id: doc.id,
					name: (doc.data().name as string) ?? 'Untitled conference'
				}))
				setConferences(options)
				if (options.length === 0) {
					form.setValue('conferenceId', '')
				}
			} catch (error) {
				console.error('Failed to load conferences for paper drafting:', error)
				toast.error('Unable to load conferences right now. Please try again later.')
			} finally {
				if (isMounted) {
					setIsLoadingConferences(false)
				}
			}
		}

		void loadConferences()

		return () => {
			isMounted = false
		}
	}, [form])

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
			setFileError('Only PDF manuscripts are supported right now.')
			return
		}

		if (selectedFile.size > MANUSCRIPT_MAX_SIZE_BYTES) {
			setFileError(`The manuscript must be ${MANUSCRIPT_MAX_SIZE_LABEL} or smaller.`)
			return
		}

		setFileError(null)

		setIsSubmitting(true)

		try {
			const payload = new FormData()
			payload.append('title', data.title)
			payload.append('conferenceId', data.conferenceId)
			payload.append('file', selectedFile)

			const response = await fetch('/api/papers', {
				method: 'POST',
				body: payload
			})

			if (!response.ok) {
				let message = 'There was an error submitting your paper. Please try again.'
				try {
					const payload = (await response.json()) as { error?: string }
					if (payload?.error) {
						message = payload.error
					}
				} catch (error) {
					console.warn('Failed to parse paper error response:', error)
				}
				if (message.toLowerCase().includes('manuscript')) {
					setFileError(message)
				}
				throw new Error(message)
			}

			toast.success('Paper submitted successfully!')
			form.reset({ title: '', conferenceId: '' })
			setSelectedFile(null)
			if (fileInputRef.current) {
				fileInputRef.current.value = ''
			}
			setFileError(null)
		} catch (error) {
			console.error('Error submitting paper:', error)
			const message =
				error instanceof Error ? error.message : 'There was an error submitting your paper. Please try again.'
			toast.error(message)
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<header className='space-y-1 mb-6'>
				<PageTitle>Submit Paper</PageTitle>
				<PageDescription>Provide your manuscript title. Two reviewers will be assigned automatically.</PageDescription>
			</header>
			<Card>
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
												<SelectValue
													placeholder={isLoadingConferences ? 'Loading conferences...' : 'Select a conference'}
												/>
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
											<p className='text-xs text-muted-foreground'>No conferences are available right now.</p>
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
										<FormLabel>Title</FormLabel>
										<FormControl>
											<Input
												placeholder='Enter paper title'
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className='space-y-2'>
								<FormLabel>Manuscript</FormLabel>
								<Input
									type='file'
									accept='application/pdf'
									disabled={isSubmitting || isLoadingConferences || conferences.length === 0}
									ref={fileInputRef}
									onChange={(event) => {
										const file = event.target.files?.[0] ?? null
										setSelectedFile(file)
										setFileError(null)
									}}
								/>
								{selectedFile ? (
									<p className='text-xs text-muted-foreground'>Selected file: {selectedFile.name}</p>
								) : (
									<p className='text-xs text-muted-foreground'>No manuscript selected yet.</p>
								)}
								<p className='text-xs text-muted-foreground'>Upload a PDF up to {MANUSCRIPT_MAX_SIZE_LABEL}.</p>
								{fileError && <p className='text-xs text-destructive'>{fileError}</p>}
							</div>
							<Button
								type='submit'
								disabled={isSubmitting || isLoadingConferences || conferences.length === 0 || !selectedFile}
							>
								{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
								Submit paper
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	)
}
