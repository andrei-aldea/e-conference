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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { signupSchema, type SignupInput } from '@/lib/validation/schemas'
import { Eye, EyeOff, Loader } from 'lucide-react'
import Link from 'next/link'

export function SignupForm({ className, ...props }: ComponentProps<'div'>) {
	const form = useForm<SignupInput>({
		resolver: zodResolver(signupSchema),
		defaultValues: {
			name: '',
			email: '',
			password: '',
			confirmPassword: ''
		}
	})

	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)
	const { signup } = useAuth()

	async function onSubmit(data: SignupInput) {
		setIsSubmitting(true)
		try {
			await signup(data)
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
					<CardTitle className='text-xl'>Create your account</CardTitle>
					<CardDescription>Enter your email below to create your account</CardDescription>
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
									name='name'
									render={({ field }) => (
										<FormItem>
											<Field>
												<FieldLabel>Full Name</FieldLabel>
												<FormControl>
													<Input
														type='text'
														placeholder='John'
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
									name='role'
									render={({ field }) => (
										<FormItem>
											<Field>
												<FieldLabel>Role</FieldLabel>
												<Select
													onValueChange={field.onChange}
													defaultValue={field.value}
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
											</Field>
										</FormItem>
									)}
								/>
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
								<div className='grid grid-cols-2 gap-4'>
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
									<FormField
										control={form.control}
										name='confirmPassword'
										render={({ field }) => (
											<FormItem>
												<Field>
													<FieldLabel>Confirm Password</FieldLabel>
													<div className='relative'>
														<FormControl>
															<Input
																type={showConfirmPassword ? 'text' : 'password'}
																{...field}
															/>
														</FormControl>
														<Button
															type='button'
															variant='ghost'
															size='icon-sm'
															className='absolute right-1 top-1/2 -translate-y-1/2'
															onClick={() => setShowConfirmPassword(!showConfirmPassword)}
														>
															{showConfirmPassword ? <EyeOff /> : <Eye />}
														</Button>
													</div>
													<FormMessage />
												</Field>
											</FormItem>
										)}
									/>
								</div>
								<FieldDescription>Must be at least 8 characters long.</FieldDescription>
								<Button
									disabled={isSubmitting}
									type='submit'
									className='w-full'
								>
									{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
									Create Account
								</Button>
								<FieldDescription className='flex flex-col items-center gap-1 text-center text-sm text-muted-foreground'>
									<span>
										Already have an account? <Link href='login'>Sign in</Link>
									</span>
									<Link
										href='/'
										className='text-foreground underline-offset-4 hover:underline'
									>
										Back to landing page
									</Link>
								</FieldDescription>
							</FieldGroup>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}
