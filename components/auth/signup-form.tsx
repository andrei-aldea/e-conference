'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { registerUser } from '@/lib/actions/auth'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const signupSchema = z
	.object({
		name: z.string().min(1, 'Name is required'),
		username: z
			.string()
			.min(3, 'Username must be at least 3 characters')
			.regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
		password: z.string().min(8, 'Password must be at least 8 characters'),
		confirmPassword: z.string(),
		role: z.enum(['organizer', 'author', 'reviewer'])
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	})

type SignupInput = z.infer<typeof signupSchema>

export function SignupForm() {
	const form = useForm<SignupInput>({
		resolver: zodResolver(signupSchema),
		defaultValues: { name: '', username: '', password: '', confirmPassword: '', role: 'author' }
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	async function onSubmit(data: SignupInput) {
		setIsSubmitting(true)
		try {
			const result = await registerUser({
				name: data.name,
				username: data.username,
				password: data.password,
				confirmPassword: data.confirmPassword,
				role: data.role
			})
			if (result.error) {
				toast.error(result.error)
				return
			}

			const signInResult = await signIn('credentials', {
				username: data.username,
				password: data.password,
				redirect: false
			})

			if (signInResult?.error) {
				toast.error('Account created, but login failed')
				router.push('/login')
			} else {
				toast.success('Account created!')
				router.push('/dashboard')
				router.refresh()
			}
		} catch {
			toast.error('Something went wrong')
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div className='flex min-h-screen items-center justify-center bg-muted/30 p-4'>
			<Card className='w-full max-w-md'>
				<CardHeader className='space-y-1 text-center'>
					<CardTitle className='text-2xl font-bold'>Create an account</CardTitle>
					<CardDescription>Enter your details to get started</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='name'>Full Name</Label>
								<Input
									id='name'
									placeholder='John Doe'
									{...form.register('name')}
								/>
								{form.formState.errors.name && (
									<p className='text-sm text-destructive'>{form.formState.errors.name.message}</p>
								)}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='username'>Username</Label>
								<Input
									id='username'
									placeholder='johndoe'
									{...form.register('username')}
								/>
								{form.formState.errors.username && (
									<p className='text-sm text-destructive'>{form.formState.errors.username.message}</p>
								)}
							</div>
						</div>

						<div className='space-y-2'>
							<Label htmlFor='role'>Role</Label>
							<Select
								onValueChange={(value) => form.setValue('role', value as SignupInput['role'])}
								defaultValue='author'
							>
								<SelectTrigger>
									<SelectValue placeholder='Select a role' />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value='organizer'>Organizer</SelectItem>
									<SelectItem value='author'>Author</SelectItem>
									<SelectItem value='reviewer'>Reviewer</SelectItem>
								</SelectContent>
							</Select>
							{form.formState.errors.role && (
								<p className='text-sm text-destructive'>{form.formState.errors.role.message}</p>
							)}
						</div>

						<div className='grid gap-4 sm:grid-cols-2'>
							<div className='space-y-2'>
								<Label htmlFor='password'>Password</Label>
								<Input
									id='password'
									type='password'
									placeholder='••••••••'
									{...form.register('password')}
								/>
								{form.formState.errors.password && (
									<p className='text-sm text-destructive'>{form.formState.errors.password.message}</p>
								)}
							</div>

							<div className='space-y-2'>
								<Label htmlFor='confirmPassword'>Confirm Password</Label>
								<Input
									id='confirmPassword'
									type='password'
									placeholder='••••••••'
									{...form.register('confirmPassword')}
								/>
								{form.formState.errors.confirmPassword && (
									<p className='text-sm text-destructive'>{form.formState.errors.confirmPassword.message}</p>
								)}
							</div>
						</div>

						<Button
							type='submit'
							className='w-full'
							disabled={isSubmitting}
						>
							{isSubmitting && <Loader className='mr-2 h-4 w-4 animate-spin' />}
							Create account
						</Button>
					</form>

					<p className='mt-4 text-center text-sm text-muted-foreground'>
						Already have an account?{' '}
						<Link
							href='/login'
							className='font-medium text-primary hover:underline'
						>
							Sign in
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
