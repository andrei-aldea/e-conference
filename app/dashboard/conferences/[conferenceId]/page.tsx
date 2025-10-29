'use client'

import { useEffect, useMemo, useState } from 'react'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { doc, Timestamp, updateDoc } from 'firebase/firestore'
import { CalendarIcon, Loader } from 'lucide-react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { useDocument } from 'react-firebase-hooks/firestore'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth/auth-provider'
import { PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { db } from '@/lib/firebase/client'
import { cn } from '@/lib/utils'
import { type Conference, type ConferenceInput, conferenceSchema } from '@/lib/validation/schemas'

type FirestoreConference = Omit<Conference, 'startDate' | 'endDate'> & {
	startDate: Timestamp
	endDate: Timestamp
}

export default function ConferenceDetailsPage() {
	const { user } = useAuth()
	const [isEditing, setIsEditing] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<ConferenceInput>({
		resolver: zodResolver(conferenceSchema)
	})

	const params = useParams<{ conferenceId: string }>()
	const conferenceId = params?.conferenceId
	const searchParams = useSearchParams()
	const conferenceRef = conferenceId ? doc(db, 'conferences', conferenceId) : null
	const [snapshot, loading, error] = useDocument(conferenceRef)

	const conference = useMemo(() => {
		if (!snapshot || !snapshot.exists()) {
			return null
		}

		const data = snapshot.data() as FirestoreConference

		return {
			...data,
			id: snapshot.id,
			startDate: data.startDate.toDate(),
			endDate: data.endDate.toDate()
		} satisfies Conference
	}, [snapshot])

	useEffect(() => {
		if (!conference) {
			return
		}

		form.reset({
			name: conference.name,
			description: conference.description,
			location: conference.location,
			startDate: conference.startDate,
			endDate: conference.endDate
		})
	}, [conference, form])

	const canEdit = useMemo(() => {
		if (!conference || !user || user.role !== 'organizer') {
			return false
		}

		return !conference.organizerId || conference.organizerId === user.uid
	}, [conference, user])

	const shouldAutoEdit = searchParams?.get('edit') === 'true'

	useEffect(() => {
		if (!conference || !canEdit || !shouldAutoEdit) {
			return
		}

		setIsEditing(true)
	}, [canEdit, conference, shouldAutoEdit])

	if (!conferenceId) {
		return <p>Invalid conference identifier.</p>
	}

	if (loading) {
		return <p>Loading conference...</p>
	}

	if (error) {
		return <p>Error: {error.message}</p>
	}

	if (!conference) {
		return <p>Conference not found.</p>
	}

	async function onSubmit(values: ConferenceInput) {
		if (!conferenceRef) {
			return
		}

		if (!conference) {
			toast.error('Conference details are not available yet.')
			return
		}

		if (!user || user.role !== 'organizer') {
			toast.error('You must be an organizer to update this conference.')
			return
		}

		if (conference.organizerId && conference.organizerId !== user.uid) {
			toast.error('You do not have permission to edit this conference.')
			return
		}

		setIsSubmitting(true)

		try {
			await updateDoc(conferenceRef, {
				name: values.name,
				description: values.description,
				location: values.location,
				startDate: Timestamp.fromDate(values.startDate),
				endDate: Timestamp.fromDate(values.endDate)
			})

			toast.success('Conference updated successfully!')
			setIsEditing(false)
		} catch (updateError) {
			console.error('Error updating conference:', updateError)
			toast.error('There was an error updating the conference. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleCancelEdit = () => {
		if (!conference) {
			setIsEditing(false)
			return
		}

		form.reset({
			name: conference.name,
			description: conference.description,
			location: conference.location,
			startDate: conference.startDate,
			endDate: conference.endDate
		})
		setIsEditing(false)
	}

	return (
		<>
			<div className='flex flex-wrap items-center justify-between gap-3'>
				<PageTitle>Conference details</PageTitle>
			</div>
			{isEditing ? (
				<Card>
					<CardHeader>
						<CardTitle>Edit conference</CardTitle>
						<CardDescription>Update the conference information and save your changes.</CardDescription>
					</CardHeader>
					<CardContent>
						<Form {...form}>
							<form
								onSubmit={form.handleSubmit(onSubmit)}
								className='space-y-8'
							>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Conference name</FormLabel>
											<FormControl>
												<Input
													placeholder='e.g., International Conference on AI'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='location'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Location</FormLabel>
											<FormControl>
												<Input
													placeholder='e.g., Online or New York, NY'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='description'
									render={({ field }) => (
										<FormItem>
											<FormLabel>Description</FormLabel>
											<FormControl>
												<Textarea
													placeholder='Describe the conference theme, topics, and goals.'
													className='resize-none'
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<div className='flex flex-col gap-6 lg:flex-row'>
									<FormField
										control={form.control}
										name='startDate'
										render={({ field }) => (
											<FormItem className='flex flex-col'>
												<FormLabel>Start date</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant='outline'
																className={cn(
																	'w-60 pl-3 text-left font-normal',
																	!field.value && 'text-muted-foreground'
																)}
															>
																{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
																<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className='w-auto p-0'
														align='start'
													>
														<Calendar
															mode='single'
															selected={field.value}
															onSelect={field.onChange}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name='endDate'
										render={({ field }) => (
											<FormItem className='flex flex-col'>
												<FormLabel>End date</FormLabel>
												<Popover>
													<PopoverTrigger asChild>
														<FormControl>
															<Button
																variant='outline'
																className={cn(
																	'w-60 pl-3 text-left font-normal',
																	!field.value && 'text-muted-foreground'
																)}
															>
																{field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
																<CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
															</Button>
														</FormControl>
													</PopoverTrigger>
													<PopoverContent
														className='w-auto p-0'
														align='start'
													>
														<Calendar
															mode='single'
															selected={field.value}
															onSelect={field.onChange}
															initialFocus
														/>
													</PopoverContent>
												</Popover>
												<FormMessage />
											</FormItem>
										)}
									/>
								</div>
								<div className='flex flex-wrap justify-end gap-2'>
									<Button
										type='button'
										variant='outline'
										onClick={handleCancelEdit}
										disabled={isSubmitting}
									>
										Cancel
									</Button>
									<Button
										type='submit'
										disabled={isSubmitting}
									>
										{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
										Save changes
									</Button>
								</div>
							</form>
						</Form>
					</CardContent>
				</Card>
			) : (
				<Card>
					<CardHeader>
						<CardTitle>{conference.name}</CardTitle>
						<CardDescription>{conference.location}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className='space-y-6'>
							<section>
								<p>{conference.description}</p>
							</section>
							<div className='grid gap-4 sm:grid-cols-2'>
								<div className='rounded-lg border p-4'>
									<p className='text-xs font-medium uppercase text-muted-foreground'>Start date</p>
									<p className='mt-1 text-sm font-semibold'>{format(conference.startDate, 'PPPP p')}</p>
								</div>
								<div className='rounded-lg border p-4'>
									<p className='text-xs font-medium uppercase text-muted-foreground'>End date</p>
									<p className='mt-1 text-sm font-semibold'>{format(conference.endDate, 'PPPP p')}</p>
								</div>
							</div>
						</div>
					</CardContent>
					<CardFooter className='flex flex-wrap justify-between gap-4'>
						<Button
							variant='secondary'
							asChild
						>
							<Link href='/dashboard/conferences'>Back to conferences</Link>
						</Button>
					</CardFooter>
				</Card>
			)}
		</>
	)
}
