'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { type LoginInput, loginSchema } from '@/lib/schemas'
import { cn } from '@/lib/utils'
import { Loader } from 'lucide-react'
import Link from 'next/link'

export function LoginForm({ className, ...props }: React.ComponentProps<'div'>) {
	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: ''
		}
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const { login } = useAuth()

	async function onSubmit(data: LoginInput) {
		setIsSubmitting(true)
		try {
			await login(data)
		} catch (error) {
			// Error is already alerted in AuthProvider, just stop submitting
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<div
			className={cn('flex flex-col gap-6', className)}
			{...props}
		>
			<Card>
				<CardHeader className='text-center'>
					<CardTitle className='text-xl'>Sign in to your account</CardTitle>
					<CardDescription>Enter your email and password below to sign in</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className='space-y-4'
						>
							<FieldGroup>
								<FormField
									control={form.control}
									name='email'
									render={({ field }) => (
										<FormItem>
											<Field>
												<FieldLabel>Email</FieldLabel>
												<FormControl>
													<Input
														type='email'
														placeholder='m@example.com'
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='password'
									render={({ field }) => (
										<FormItem>
											<Field>
												<FieldLabel>Password</FieldLabel>
												<FormControl>
													<Input
														type='password'
														{...field}
													/>
												</FormControl>
												<FormMessage />
											</Field>
										</FormItem>
									)}
								/>
								<Field>
									<Button
										type='submit'
										disabled={isSubmitting}
									>
										{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
										Sign In
									</Button>
									<FieldDescription className='text-center'>
										Don&apos;t have an account? <Link href='signup'>Sign up</Link>
									</FieldDescription>
								</Field>
							</FieldGroup>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
