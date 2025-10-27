'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { type ConferenceInput, conferenceSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'

export default function CreateConferencePage() {
	const form = useForm<ConferenceInput>({
		resolver: zodResolver(conferenceSchema),
		defaultValues: {
			name: '',
			description: ''
		}
	})

	function onSubmit(data: ConferenceInput) {
		// TODO: Implement actual API call
		console.log('Creating conference with data:', data)
		alert('Conference created successfully! (Check console for data)')
	}

	return (
		<>
			<h1>Create New Conference</h1>
			<Card>
				<CardHeader>
					<CardTitle>Create New Conference</CardTitle>
					<CardDescription>Fill out the details below to create a new conference.</CardDescription>
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
							<Button type='submit'>Create Conference</Button>
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	)
}
