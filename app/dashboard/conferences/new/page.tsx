'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

import { ConferenceForm } from '@/components/dashboard/conference-form'
import { PageDescription, PageHeader, PageTitle } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { type ConferenceInput } from '@/lib/validation/schemas'

export default function CreateConferencePage() {
	const { data: session } = useSession()
	const user = session?.user
	const router = useRouter()
	const [isSubmitting, setIsSubmitting] = useState(false)

	async function onSubmit(data: ConferenceInput) {
		if (!user || user.role !== 'organizer') {
			toast.error('You must be an organizer to create a conference.')
			return
		}

		setIsSubmitting(true)
		try {
			const response = await fetch('/api/conferences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					...data,
					startDate: data.startDate.toISOString(),
					endDate: data.endDate.toISOString()
				})
			})

			if (!response.ok) {
				const err = await response.json()
				throw new Error(err.error || 'Failed to create conference')
			}

			toast.success('Conference created successfully!')
			router.push('/dashboard/conferences') // Redirect to the conference list
		} catch (e: unknown) {
			console.error('Error adding document: ', e)
			toast.error((e as Error).message || 'There was an error creating the conference. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className='space-y-6'>
			<PageHeader className='mb-0'>
				<PageTitle>Create New Conference</PageTitle>
				<PageDescription>Fill out the form below to create a new conference.</PageDescription>
			</PageHeader>
			<Card className='max-w-2xl'>
				<CardHeader>
					<CardTitle>Conference Details</CardTitle>
					<CardDescription>Enter the details for your new conference.</CardDescription>
				</CardHeader>
				<CardContent>
					<ConferenceForm
						onSubmit={onSubmit}
						isSubmitting={isSubmitting}
					/>
				</CardContent>
			</Card>
		</div>
	)
}
