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

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const loginSchema = z.object({
	username: z.string().min(1, 'Username is required'),
	password: z.string().min(1, 'Password is required')
})

type LoginInput = z.infer<typeof loginSchema>

export function LoginForm() {
	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { username: '', password: '' }
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	async function onSubmit(data: LoginInput) {
		setIsSubmitting(true)
		try {
			const result = await signIn('credentials', {
				username: data.username,
				password: data.password,
				redirect: false
			})

			if (result?.error) {
				toast.error('Invalid username or password')
			} else {
				toast.success('Welcome back!')
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
		<Card>
			<CardHeader className='pb-4 text-center'>
				<CardTitle className='text-2xl font-bold'>Welcome back</CardTitle>
				<CardDescription className='mt-2'>Sign in to your account</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className='space-y-4'
				>
					<div className='space-y-2'>
						<Label htmlFor='username'>Username</Label>
						<Input
							id='username'
							type='text'
							placeholder='Enter username'
							{...form.register('username')}
						/>
						{form.formState.errors.username && (
							<p className='text-destructive text-sm'>{form.formState.errors.username.message}</p>
						)}
					</div>

					<div className='space-y-2'>
						<Label htmlFor='password'>Password</Label>
						<Input
							id='password'
							type='password'
							placeholder='••••••••'
							{...form.register('password')}
						/>
						{form.formState.errors.password && (
							<p className='text-destructive text-sm'>{form.formState.errors.password.message}</p>
						)}
					</div>

					<Button
						type='submit'
						className='w-full'
						disabled={isSubmitting}
					>
						{isSubmitting && <Loader className='mr-2 h-4 w-4 animate-spin' />}
						Sign in
					</Button>
				</form>

				<p className='text-muted-foreground mt-4 text-center text-sm'>
					Don&apos;t have an account?{' '}
					<Link
						href='/signup'
						className='text-primary font-medium hover:underline'
					>
						Sign up
					</Link>
				</p>
			</CardContent>
		</Card>
	)
}
