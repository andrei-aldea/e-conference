'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { CalendarIcon, Loader } from 'lucide-react'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { type ConferenceInput, conferenceSchema } from '@/lib/validation/schemas'

interface ConferenceFormProps {
	defaultValues?: Partial<ConferenceInput>
	onSubmit: (data: ConferenceInput) => Promise<void>
	isSubmitting?: boolean
	submitLabel?: string
}

export function ConferenceForm({
	defaultValues,
	onSubmit,
	isSubmitting = false,
	submitLabel = 'Create Conference'
}: ConferenceFormProps) {
	const form = useForm<ConferenceInput>({
		resolver: zodResolver(conferenceSchema),
		defaultValues: {
			name: '',
			description: '',
			location: '',
			...defaultValues
		}
	})

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className='space-y-6'
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
				<div className='flex flex-col gap-6 lg:flex-row'>
					<FormField
						control={form.control}
						name='startDate'
						render={({ field }) => (
							<FormItem className='flex flex-1 flex-col'>
								<FormLabel>Start Date</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={'outline'}
												className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
							<FormItem className='flex flex-1 flex-col'>
								<FormLabel>End Date</FormLabel>
								<Popover>
									<PopoverTrigger asChild>
										<FormControl>
											<Button
												variant={'outline'}
												className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
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
					className='w-full'
				>
					{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
					{submitLabel}
				</Button>
			</form>
		</Form>
	)
}
