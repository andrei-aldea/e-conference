'use client'

import { Loader, Mail, MapPin, Phone } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'
import { FormEvent, useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const contactFormSchema = z.object({
	name: z.string().trim().min(1, 'Please enter your name'),
	email: z.string().trim().email('Please enter a valid email'),
	message: z.string().trim().min(10, 'Message must be at least 10 characters')
})

type ContactFormValues = z.infer<typeof contactFormSchema>

const contactInfo = [
	{
		icon: Mail,
		title: 'Email',
		value: 'contact@aldeaandrei.com',
		href: 'mailto:contact@aldeaandrei.com'
	},
	{
		icon: Phone,
		title: 'Phone',
		value: '+40 733 626 626',
		href: 'tel:+40733626626'
	},
	{
		icon: MapPin,
		title: 'Location',
		value: 'Bucharest, Romania',
		href: null
	}
]

export default function ContactPage() {
	const [errors, setErrors] = useState<Partial<Record<keyof ContactFormValues, string>>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSubmitting(true)

		const formData = new FormData(event.currentTarget)
		const payload: ContactFormValues = {
			name: (formData.get('name') as string) || '',
			email: (formData.get('email') as string) || '',
			message: (formData.get('message') as string) || ''
		}

		const result = contactFormSchema.safeParse(payload)

		if (!result.success) {
			const newErrors: Partial<Record<keyof ContactFormValues, string>> = {}
			result.error.issues.forEach((issue) => {
				const field = issue.path[0] as keyof ContactFormValues
				newErrors[field] = issue.message
			})
			setErrors(newErrors)
			setIsSubmitting(false)
			return
		}

		setErrors({})
		event.currentTarget.reset()
		toast.success("Thanks for reaching out! We'll get back to you soon.")
		setIsSubmitting(false)
	}

	return (
		<div className='bg-background min-h-screen'>
			{/* Hero */}
			<section className='relative overflow-hidden py-24'>
				<div className='absolute inset-0 -z-10'>
					<div className='from-primary/5 to-secondary/10 absolute inset-0 bg-gradient-to-br via-transparent' />
					<motion.div
						className='bg-primary/10 absolute top-1/4 right-1/4 h-64 w-64 rounded-full blur-3xl'
						animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
						transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
					/>
				</div>

				<div className='mx-auto max-w-4xl px-4 text-center'>
					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className='text-foreground text-4xl font-bold tracking-tight sm:text-5xl'
					>
						Get in <span className='text-primary'>touch</span>
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className='text-muted-foreground mt-4 text-lg'
					>
						Have questions about eConference? We&apos;re here to help.
					</motion.p>
				</div>
			</section>

			{/* Contact Grid */}
			<section className='pb-24'>
				<div className='mx-auto max-w-6xl px-4'>
					<div className='grid gap-8 lg:grid-cols-5'>
						{/* Contact Form */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
							className='lg:col-span-3'
						>
							<Card>
								<CardHeader>
									<CardTitle>Send us a message</CardTitle>
									<CardDescription>Fill out the form below and we&apos;ll respond within 24 hours.</CardDescription>
								</CardHeader>
								<CardContent>
									<form
										onSubmit={handleSubmit}
										className='space-y-4'
									>
										<div className='grid gap-4 sm:grid-cols-2'>
											<div className='space-y-2'>
												<Label htmlFor='name'>Name</Label>
												<Input
													id='name'
													name='name'
													placeholder='Your full name'
												/>
												{errors.name && <p className='text-destructive text-sm'>{errors.name}</p>}
											</div>
											<div className='space-y-2'>
												<Label htmlFor='email'>Email</Label>
												<Input
													id='email'
													name='email'
													type='email'
													placeholder='you@company.com'
												/>
												{errors.email && <p className='text-destructive text-sm'>{errors.email}</p>}
											</div>
										</div>

										<div className='space-y-2'>
											<Label htmlFor='message'>Message</Label>
											<Textarea
												id='message'
												name='message'
												placeholder='How can we help you?'
												rows={5}
											/>
											{errors.message && <p className='text-destructive text-sm'>{errors.message}</p>}
										</div>

										<Button
											type='submit'
											className='w-full'
											disabled={isSubmitting}
										>
											{isSubmitting && <Loader className='mr-2 h-4 w-4 animate-spin' />}
											Send Message
										</Button>
									</form>
								</CardContent>
							</Card>
						</motion.div>

						{/* Contact Info */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className='lg:col-span-2'
						>
							<Card className='h-full'>
								<CardHeader>
									<CardTitle>Contact Information</CardTitle>
									<CardDescription>Reach out through any of these channels.</CardDescription>
								</CardHeader>
								<CardContent className='space-y-6'>
									{contactInfo.map((info, index) => (
										<motion.div
											key={info.title}
											initial={{ opacity: 0, y: 10 }}
											whileInView={{ opacity: 1, y: 0 }}
											viewport={{ once: true }}
											transition={{ delay: 0.3 + index * 0.1 }}
											className='flex items-start gap-4'
										>
											<div className='bg-primary/10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg'>
												<info.icon className='text-primary h-5 w-5' />
											</div>
											<div>
												<p className='text-foreground font-medium'>{info.title}</p>
												{info.href ? (
													<Link
														href={info.href}
														className='text-muted-foreground hover:text-primary text-sm transition-colors'
													>
														{info.value}
													</Link>
												) : (
													<p className='text-muted-foreground text-sm'>{info.value}</p>
												)}
											</div>
										</motion.div>
									))}
								</CardContent>
							</Card>
						</motion.div>
					</div>
				</div>
			</section>
		</div>
	)
}
