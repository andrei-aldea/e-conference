'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { db } from '@/lib/firebase/client'
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
				console.error('Failed to load conferences for paper submission:', error)
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

		setIsSubmitting(true)

		try {
			const response = await fetch('/api/papers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ title: data.title, conferenceId: data.conferenceId })
			})

			if (!response.ok) {
				let message = 'There was an error submitting your paper. Please try again.'
				try {
					const payload = (await response.json()) as { error?: string }
					if (payload?.error) {
						message = payload.error
					}
				} catch (error) {
					console.warn('Failed to parse submission error response:', error)
				}
				throw new Error(message)
			}

			toast.success('Paper submitted successfully!')
			form.reset({ title: '', conferenceId: '' })
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
			<PageTitle>Submit Paper</PageTitle>
			<PageDescription>Provide your manuscript title. Two reviewers will be assigned automatically.</PageDescription>
			<Card>
				<CardHeader>
					<CardTitle>Paper submission</CardTitle>
					<CardDescription>
						Provide your manuscript title. Two reviewers will be assigned automatically.
					</CardDescription>
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
							<p className='text-sm text-muted-foreground'>
								Reviewers will see the title once your manuscript upload flow is ready.
							</p>
							<Button
								type='submit'
								disabled={isSubmitting || isLoadingConferences || conferences.length === 0}
							>
								{isSubmitting ? 'Submitting...' : 'Submit paper'}
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	)
}
