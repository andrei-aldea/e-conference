'use client'

import { ArrowRight, BarChart3, CalendarCheck, FileText, ShieldCheck, Users, Zap } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const features = [
	{
		title: 'Conference Management',
		description:
			'Create and manage conferences with ease. Set dates, locations, and track submissions all in one place.',
		icon: CalendarCheck
	},
	{
		title: 'Paper Submissions',
		description: 'Authors can submit papers through a streamlined process with real-time status tracking.',
		icon: FileText
	},
	{
		title: 'Peer Review',
		description: 'Reviewers receive assignments and provide feedback through an intuitive interface.',
		icon: Users
	},
	{
		title: 'Role-Based Access',
		description: 'Every role gets a tailored dashboard showing exactly what needs attention.',
		icon: BarChart3
	},
	{
		title: 'Fast & Modern',
		description: 'Built with the latest technology for speed and reliability across all devices.',
		icon: Zap
	},
	{
		title: 'Secure by Design',
		description: 'Robust authentication and authorization keeps your conference data protected.',
		icon: ShieldCheck
	}
]

const steps = [
	{
		number: '01',
		title: 'Sign Up',
		description: 'Create your account and choose your role in the conference ecosystem.'
	},
	{ number: '02', title: 'Set Up', description: 'Organizers create conferences, authors prepare submissions.' },
	{ number: '03', title: 'Submit', description: 'Authors upload papers and organizers assign reviewers.' },
	{ number: '04', title: 'Review', description: 'Reviewers evaluate papers and provide their decisions.' }
]

const stats = [
	{ value: '3', label: 'Roles' },
	{ value: '∞', label: 'Conferences' },
	{ value: '<5min', label: 'Setup Time' }
]

export default function HomePage() {
	return (
		<div className='min-h-screen bg-background'>
			{/* Hero Section */}
			<section className='relative overflow-hidden'>
				<div className='absolute inset-0 -z-10'>
					<div className='absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/10' />
					<motion.div
						className='absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl'
						animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
						transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
					/>
					<motion.div
						className='absolute bottom-20 right-1/4 h-96 w-96 rounded-full bg-secondary/20 blur-3xl'
						animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.6, 0.4] }}
						transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
					/>
				</div>

				<div className='mx-auto max-w-7xl px-4 py-24 sm:py-32'>
					<div className='flex flex-col items-center text-center'>
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							className='mb-6'
						>
							<span className='inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm font-medium text-muted-foreground'>
								<CalendarCheck className='h-4 w-4 text-primary' />
								Academic Conference Platform
							</span>
						</motion.div>

						<motion.h1
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
							className='max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl'
						>
							Manage conferences <span className='text-primary'>effortlessly</span>
						</motion.h1>

						<motion.p
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							className='mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl'
						>
							eConference brings organizers, authors, and reviewers together in one unified platform. Streamline
							submissions, reviews, and decisions.
						</motion.p>

						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.3 }}
							className='mt-10 flex flex-col gap-4 sm:flex-row'
						>
							<Button
								size='lg'
								asChild
							>
								<Link href='/signup'>
									Get Started
									<ArrowRight className='ml-2 h-4 w-4' />
								</Link>
							</Button>
							<Button
								size='lg'
								variant='outline'
								asChild
							>
								<Link href='/login'>Sign In</Link>
							</Button>
						</motion.div>

						{/* Stats */}
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.4 }}
							className='mt-16 grid grid-cols-3 gap-8'
						>
							{stats.map((stat, index) => (
								<motion.div
									key={stat.label}
									initial={{ opacity: 0, scale: 0.9 }}
									animate={{ opacity: 1, scale: 1 }}
									transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
									className='text-center'
								>
									<div className='text-3xl font-bold text-primary sm:text-4xl'>{stat.value}</div>
									<div className='mt-1 text-sm text-muted-foreground'>{stat.label}</div>
								</motion.div>
							))}
						</motion.div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className='py-24 bg-muted/30'>
				<div className='mx-auto max-w-7xl px-4'>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className='text-center mb-16'
					>
						<h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>Everything you need</h2>
						<p className='mt-4 text-lg text-muted-foreground max-w-2xl mx-auto'>
							A complete toolkit for managing academic conferences from start to finish.
						</p>
					</motion.div>

					<div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
						{features.map((feature, index) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
							>
								<Card className='h-full border-border/50 bg-card/50 backdrop-blur transition-all hover:border-primary/30 hover:shadow-lg'>
									<CardHeader>
										<div className='mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10'>
											<feature.icon className='h-6 w-6 text-primary' />
										</div>
										<CardTitle className='text-xl'>{feature.title}</CardTitle>
										<CardDescription className='text-base'>{feature.description}</CardDescription>
									</CardHeader>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* How It Works Section */}
			<section className='py-24'>
				<div className='mx-auto max-w-7xl px-4'>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className='text-center mb-16'
					>
						<h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>How it works</h2>
						<p className='mt-4 text-lg text-muted-foreground max-w-2xl mx-auto'>
							Get your conference up and running in four simple steps.
						</p>
					</motion.div>

					<div className='grid gap-8 md:grid-cols-2 lg:grid-cols-4'>
						{steps.map((step, index) => (
							<motion.div
								key={step.number}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.15 }}
								className='relative'
							>
								<div className='flex flex-col items-center text-center'>
									<motion.div
										whileHover={{ scale: 1.1 }}
										className='mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground'
									>
										{step.number}
									</motion.div>
									<h3 className='text-xl font-semibold text-foreground'>{step.title}</h3>
									<p className='mt-2 text-muted-foreground'>{step.description}</p>
								</div>
								{index < steps.length - 1 && (
									<div className='absolute top-8 left-[calc(50%+40px)] hidden h-0.5 w-[calc(100%-80px)] bg-border lg:block' />
								)}
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className='py-24 bg-primary/5'>
				<div className='mx-auto max-w-7xl px-4'>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<Card className='border-0 bg-card shadow-xl'>
							<CardContent className='flex flex-col items-center py-16 text-center'>
								<h2 className='text-3xl font-bold tracking-tight text-foreground sm:text-4xl'>Ready to get started?</h2>
								<p className='mt-4 max-w-xl text-lg text-muted-foreground'>
									Join eConference today and experience a better way to manage academic conferences.
								</p>
								<div className='mt-8 flex flex-col gap-4 sm:flex-row'>
									<Button
										size='lg'
										asChild
									>
										<Link href='/signup'>
											Create Account
											<ArrowRight className='ml-2 h-4 w-4' />
										</Link>
									</Button>
									<Button
										size='lg'
										variant='outline'
										asChild
									>
										<Link href='/roles'>Learn About Roles</Link>
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* Footer */}
			<footer className='border-t border-border py-12'>
				<div className='mx-auto max-w-7xl px-4'>
					<div className='flex flex-col items-center justify-between gap-4 sm:flex-row'>
						<div className='flex items-center gap-2'>
							<CalendarCheck className='h-6 w-6 text-primary' />
							<span className='text-lg font-semibold'>eConference</span>
						</div>
						<p className='text-sm text-muted-foreground'>
							© {new Date().getFullYear()} eConference. Academic conference management.
						</p>
					</div>
				</div>
			</footer>
		</div>
	)
}
