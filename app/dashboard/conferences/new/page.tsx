'use client'

import { useAuth } from '@/components/auth-provider'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { addDoc, collection, Timestamp } from 'firebase/firestore'
import { CalendarIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { db } from '@/lib/firebase'
import { type ConferenceInput, conferenceSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'

export default function CreateConferencePage() {
	const form = useForm<ConferenceInput>({
		resolver: zodResolver(conferenceSchema),
		defaultValues: {
			name: '',
			description: '',
			location: ''
		}
	})

	const { user } = useAuth()
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function onSubmit(data: ConferenceInput) {
		if (!user || user.role !== 'organizer') {
			toast.error('You must be an organizer to create a conference.')
			return
		}

		setIsSubmitting(true)
		try {
			const conferenceData = {
				...data,
				organizerId: user.uid,
				startDate: Timestamp.fromDate(data.startDate),
				endDate: Timestamp.fromDate(data.endDate)
			}
			const docRef = await addDoc(collection(db, 'conferences'), conferenceData)
			console.log('Document written with ID: ', docRef.id)
			toast.success('Conference created successfully!')
			router.push('/dashboard/conferences') // Redirect to the conference list
		} catch (e) {
			console.error('Error adding document: ', e)
			toast.error('There was an error creating the conference. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<h1>Create New Conference</h1>
			<Card>
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
										<FormLabel>Conference Name</FormLabel>
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
												placeholder='e.g., "Online" or "New York, NY"'
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
							<div className='flex flex-col lg:flex-row gap-6'>
								<FormField
									control={form.control}
									name='startDate'
									render={({ field }) => (
										<FormItem className='flex flex-col'>
											<FormLabel>Start Date</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={'outline'}
															className={cn('w-60 pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
											<FormLabel>End Date</FormLabel>
											<Popover>
												<PopoverTrigger asChild>
													<FormControl>
														<Button
															variant={'outline'}
															className={cn('w-60 pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
							<Button
								type='submit'
								disabled={isSubmitting}
							>
								Create Conference
							</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	)
}
