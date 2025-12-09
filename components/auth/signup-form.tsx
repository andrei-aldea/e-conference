'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState, type ComponentProps } from 'react'
import { useForm } from 'react-hook-form'

// import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { registerUser } from '@/lib/actions/auth'
import { cn } from '@/lib/utils'
import { signupSchema, type SignupInput } from '@/lib/validation/schemas'
import { Check, Circle, Eye, EyeOff, Loader } from 'lucide-react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
// import { PasswordGuidance, evaluatePasswordStrength, getPasswordStrength, PASSWORD_REQUIREMENTS } from './password-guidance'

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
	const router = useRouter()

	const passwordValue = form.watch('password')
	const passwordRequirementResults = useMemo(() => evaluatePasswordStrength(passwordValue), [passwordValue])
	const metRequirementCount = passwordRequirementResults.filter((requirement) => requirement.isMet).length
	const passwordStrength = useMemo(
		() => getPasswordStrength(metRequirementCount, PASSWORD_REQUIREMENTS.length, passwordValue.length > 0),
		[metRequirementCount, passwordValue.length]
	)

	async function onSubmit(data: SignupInput) {
		setIsSubmitting(true)
		try {
			const result = await registerUser(data)
			if (result.error) {
				toast.error(result.error)
				return
			}

			const signInResult = await signIn('credentials', {
				email: data.email,
				password: data.password,
				redirect: false
			})

			if (signInResult?.error) {
				toast.error('Account created, but failed to log in automatically.')
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
		<div
			className={cn('flex flex-col gap-6', className)}
			{...props}
		>
			<Card>
				<CardHeader className='text-center'>
					<CardTitle className='text-xl'>Sign up for eConference</CardTitle>
					<CardDescription>Enter your details below to sign up.</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className='space-y-6 md:space-y-0'
						>
							<FieldGroup className='md:grid md:grid-cols-12 md:gap-6 md:space-y-0'>
								<FormField
									control={form.control}
									name='name'
									render={({ field }) => (
										<FormItem className='md:col-span-4'>
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
									name='email'
									render={({ field }) => (
										<FormItem className='md:col-span-4'>
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
									name='role'
									render={({ field }) => (
										<FormItem className='md:col-span-4'>
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
									name='password'
									render={({ field }) => (
										<FormItem className='md:col-span-6'>
											<Field>
												<FieldLabel>Password</FieldLabel>
												<div className='relative'>
													<FormControl>
														<Input
															type={showPassword ? 'text' : 'password'}
															placeholder='*******'
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
												<PasswordGuidance
													requirements={passwordRequirementResults}
													strength={passwordStrength}
													className='md:hidden'
												/>
											</Field>
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name='confirmPassword'
									render={({ field }) => (
										<FormItem className='md:col-span-6'>
											<Field>
												<FieldLabel>Confirm Password</FieldLabel>
												<div className='relative'>
													<FormControl>
														<Input
															type={showConfirmPassword ? 'text' : 'password'}
															placeholder='*******'
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
								<div className='hidden md:block md:col-span-12 md:self-stretch'>
									<PasswordGuidance
										requirements={passwordRequirementResults}
										strength={passwordStrength}
										className='md:mt-0'
									/>
								</div>
								<Button
									disabled={isSubmitting}
									type='submit'
									className='w-full md:col-span-12'
								>
									{isSubmitting && <Loader className='mr-2 size-4 animate-spin' />}
									Sign up
								</Button>
								<FieldDescription className='md:col-span-12 text-center text-sm text-muted-foreground'>
									<span>
										Already have an account?{' '}
										<Link
											href='/login'
											className='underline'
										>
											Log in
										</Link>
									</span>
								</FieldDescription>
							</FieldGroup>
						</form>
					</Form>
				</CardContent>
			</Card>
		</div>
	)
}

type PasswordRequirementConfig = {
	label: string
	test: (value: string) => boolean
}

type PasswordRequirementResult = {
	label: string
	isMet: boolean
}

type PasswordStrengthResult = {
	label: string
	textClass: string
	barClass: string
	progress: number
}

const PASSWORD_REQUIREMENTS: PasswordRequirementConfig[] = [
	{ label: 'At least 8 characters', test: (value) => value.length >= 8 },
	{ label: 'One lowercase letter', test: (value) => /[a-z]/.test(value) },
	{ label: 'One uppercase letter', test: (value) => /[A-Z]/.test(value) },
	{ label: 'One number', test: (value) => /\d/.test(value) },
	{ label: 'One symbol', test: (value) => /[^A-Za-z0-9]/.test(value) }
]

function evaluatePasswordStrength(password: string): PasswordRequirementResult[] {
	return PASSWORD_REQUIREMENTS.map((requirement) => ({
		label: requirement.label,
		isMet: requirement.test(password)
	}))
}

function getPasswordStrength(metCount: number, total: number, hasValue: boolean): PasswordStrengthResult {
	if (!hasValue) {
		return {
			label: 'Not started',
			textClass: 'text-muted-foreground',
			barClass: 'bg-muted-foreground/40',
			progress: 0
		}
	}

	if (total === 0) {
		return {
			label: 'Not started',
			textClass: 'text-muted-foreground',
			barClass: 'bg-muted-foreground/40',
			progress: 0
		}
	}

	const ratio = Math.min(Math.max(metCount / total, 0), 1)

	if (ratio < 0.4) {
		return {
			label: 'Weak',
			textClass: 'text-destructive',
			barClass: 'bg-destructive',
			progress: ratio
		}
	}

	if (ratio < 0.8) {
		return {
			label: 'Moderate',
			textClass: 'text-amber-500',
			barClass: 'bg-amber-500',
			progress: ratio
		}
	}

	if (ratio < 1) {
		return {
			label: 'Almost there',
			textClass: 'text-amber-600',
			barClass: 'bg-amber-600',
			progress: ratio
		}
	}

	return {
		label: 'Strong',
		textClass: 'text-emerald-500',
		barClass: 'bg-emerald-500',
		progress: 1
	}
}

function PasswordGuidance({
	requirements,
	strength,
	className
}: {
	requirements: PasswordRequirementResult[]
	strength: PasswordStrengthResult
	className?: string
}) {
	const progressPercent = Math.round(strength.progress * 100)

	return (
		<div
			className={cn('mt-3 space-y-2 text-xs text-muted-foreground', className)}
			aria-live='polite'
		>
			<div className='flex items-center justify-between'>
				<span className='font-medium'>Password strength</span>
				<span className={`font-semibold ${strength.textClass}`}>{strength.label}</span>
			</div>
			<div className='h-2 w-full rounded-full bg-muted'>
				<div
					className={`h-full rounded-full transition-all duration-300 ${strength.barClass}`}
					style={{ width: `${progressPercent}%` }}
					aria-hidden='true'
				/>
			</div>
			<ul className='space-y-1'>
				{requirements.map((requirement) => (
					<li
						key={requirement.label}
						className={`flex items-center gap-2 ${requirement.isMet ? 'text-foreground' : 'text-muted-foreground'}`}
					>
						{requirement.isMet ? (
							<Check className='size-4 text-emerald-500' />
						) : (
							<Circle className='size-4 opacity-70' />
						)}
						<span>{requirement.label}</span>
					</li>
				))}
			</ul>
		</div>
	)
}
