'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { doc, writeBatch } from 'firebase/firestore'
import { Edit, Loader } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { type User, userSchema } from '@/lib/validation/schemas'

export default function AccountPage() {
	const { user, updateUser } = useAuth()
	const [isEditing, setIsEditing] = useState(false)
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<User>({
		resolver: zodResolver(userSchema),
		defaultValues: {
			name: '',
			email: '',
			role: 'author'
		}
	})

	useEffect(() => {
		if (user) {
			form.reset(user)
		}
	}, [user, form])

	async function onSubmit(data: User) {
		if (!user) {
			toast.error('You must be logged in to update your profile.')
			return
		}

		setIsSubmitting(true)
		try {
			const userDocRef = doc(db, 'users', user.uid)
			const batch = writeBatch(db)
			const updatedData = {
				name: data.name,
				role: data.role
			}
			batch.set(userDocRef, { ...user, ...updatedData })
			await batch.commit()

			updateUser(updatedData)
			toast.success('Profile updated successfully!')
			setIsEditing(false)
		} catch (error) {
			console.error('Error updating profile: ', error)
			toast.error('Failed to update profile. Please try again.')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!user) {
		return <p>Loading...</p>
	}

	return (
		<>
			<header className='space-y-1 mb-6'>
				<PageTitle>My Account</PageTitle>
				<PageDescription>Manage your account details and preferences.</PageDescription>
			</header>
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
										<FormLabel>Full Name</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled={!isEditing}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='email'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<FormControl>
											<Input
												{...field}
												disabled
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name='role'
								render={({ field }) => (
									<FormItem>
										<FormLabel>Role</FormLabel>
										<Select
											onValueChange={field.onChange}
											value={field.value}
											disabled={!isEditing}
										>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder='Select a role' />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												<SelectItem value='organizer'>Organizer</SelectItem>
												<SelectItem value='author'>Author</SelectItem>
												<SelectItem value='reviewer'>Reviewer</SelectItem>
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/>
							{isEditing ? (
								<div className='flex gap-2'>
									<Button
										type='submit'
										disabled={isSubmitting}
									>
										{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
										Save Changes
									</Button>
									<Button
										type='button'
										variant='outline'
										onClick={() => {
											setIsEditing(false)
											form.reset(user)
										}}
										disabled={isSubmitting}
									>
										Cancel
									</Button>
								</div>
							) : (
								<Button
									variant='outline'
									onClick={() => setIsEditing(true)}
								>
									<Edit className='mr-2 h-4 w-4' />
									Edit Profile
								</Button>
							)}
						</form>
					</Form>
				</CardContent>
			</Card>
		</>
	)
}
