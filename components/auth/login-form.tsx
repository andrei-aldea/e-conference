'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useState, type ComponentProps } from 'react'
import { useForm } from 'react-hook-form'

import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { loginSchema, type LoginInput } from '@/lib/validation/schemas'
import { Eye, EyeOff, Loader } from 'lucide-react'
import Link from 'next/link'

export function LoginForm({ className, ...props }: ComponentProps<'div'>) {
	const form = useForm<LoginInput>({
		resolver: zodResolver(loginSchema),
		defaultValues: {
			email: '',
			password: ''
		}
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const { login } = useAuth()

	async function onSubmit(data: LoginInput) {
		setIsSubmitting(true)
		try {
			await login(data)
		} catch {
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
					<CardTitle className='text-xl'>Log in to your account</CardTitle>
					<CardDescription>Enter your email and password below to log in.</CardDescription>
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
												<div className='relative'>
													<FormControl>
														<Input
															type={showPassword ? 'text' : 'password'}
															{...field}
														/>
													</FormControl>
													<Button
														type='button'
														variant='ghost'
														size='icon-sm'
														className='absolute right-1 top-1/2 -translate-y-1/2'
														onClick={() => setShowPassword(!showPassword)}
													>
														{showPassword ? <EyeOff /> : <Eye />}
													</Button>
												</div>
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
										Log in
									</Button>
									<FieldDescription className='flex flex-col items-center gap-1 text-center text-sm text-muted-foreground'>
										<span>
											Don&apos;t have an account? <Link href='/signup'>Sign up</Link>
										</span>
										<Link
											href='/'
											className='text-foreground underline-offset-4 hover:underline'
										>
											Back to landing page
										</Link>
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
