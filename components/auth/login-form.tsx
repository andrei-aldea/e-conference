'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Loader } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'

export function LoginForm() {
	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: { email: '', password: '' }
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const router = useRouter()

	async function onSubmit(data: LoginInput) {
		setIsSubmitting(true)
		try {
			const result = await signIn('credentials', {
				email: data.email,
				password: data.password,
				redirect: false
			})

			if (result?.error) {
				toast.error('Invalid email or password')
			} else {
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
			<Card className='w-full max-w-sm'>
				<CardHeader className='space-y-1 text-center'>
					<CardTitle className='text-2xl font-bold'>Welcome back</CardTitle>
					<CardDescription>Sign in to your account</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className='space-y-4'
					>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								placeholder='you@example.com'
								{...form.register('email')}
							/>
							{form.formState.errors.email && (
								<p className='text-sm text-destructive'>{form.formState.errors.email.message}</p>
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
								<p className='text-sm text-destructive'>{form.formState.errors.password.message}</p>
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

					<p className='mt-4 text-center text-sm text-muted-foreground'>
						Don&apos;t have an account?{' '}
						<Link
							href='/signup'
							className='font-medium text-primary hover:underline'
						>
							Sign up
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	)
}
