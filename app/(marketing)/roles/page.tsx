'use client'

import { ArrowRight, CalendarCog, CheckCircle2, ClipboardCheck, FileText, Users } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const roles = [
	{
		title: 'Organizer',
		subtitle: 'Lead your conference',
		description: 'Create conferences, manage submissions, and coordinate the review process from start to finish.',
		icon: CalendarCog,
		features: [
			'Create and configure conferences with dates and locations',
			'Assign reviewers to submitted papers',
			'Track review progress and make final decisions',
			'Export data and manage the conference timeline'
		]
	},
	{
		title: 'Author',
		subtitle: 'Share your research',
		description: 'Submit papers, track their status, and stay informed about reviewer decisions.',
		icon: FileText,
		features: [
			'Submit papers to available conferences',
			'Upload and manage manuscript files',
			'Track submission status in real-time',
			'View reviewer feedback when available'
		]
	},
	{
		title: 'Reviewer',
		subtitle: 'Evaluate submissions',
		description: 'Review assigned papers, provide feedback, and help shape the conference program.',
		icon: ClipboardCheck,
		features: [
			'View papers assigned for review',
			'Accept or decline review assignments',
			'Submit decisions and feedback',
			'Track your review workload'
		]
	}
]

const comparisons = [
	{ feature: 'Dashboard', organizer: true, author: true, reviewer: true },
	{ feature: 'Create Conferences', organizer: true, author: false, reviewer: false },
	{ feature: 'Submit Papers', organizer: false, author: true, reviewer: false },
	{ feature: 'Assign Reviewers', organizer: true, author: false, reviewer: false },
	{ feature: 'Review Papers', organizer: false, author: false, reviewer: true },
	{ feature: 'View All Papers', organizer: true, author: false, reviewer: false },
	{ feature: 'Track Own Papers', organizer: false, author: true, reviewer: false }
]

export default function RolesPage() {
	return (
		<div className='bg-background min-h-screen'>
			{/* Hero */}
			<section className='relative overflow-hidden py-24'>
				<div className='absolute inset-0 -z-10'>
					<div className='from-primary/5 to-secondary/10 absolute inset-0 bg-gradient-to-br via-transparent' />
					<motion.div
						className='bg-primary/10 absolute top-1/4 left-1/3 h-64 w-64 rounded-full blur-3xl'
						animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.5, 0.3] }}
						transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
					/>
				</div>

				<div className='mx-auto max-w-4xl px-4 text-center'>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5 }}
						className='mb-6'
					>
						<span className='border-border bg-card text-muted-foreground inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium'>
							<Users className='text-primary h-4 w-4' />
							Three Roles, One Platform
						</span>
					</motion.div>

					<motion.h1
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.1 }}
						className='text-foreground text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl'
					>
						Find your role in the <span className='text-primary'>conference ecosystem</span>
					</motion.h1>

					<motion.p
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.5, delay: 0.2 }}
						className='text-muted-foreground mt-6 text-lg'
					>
						Whether you&apos;re organizing a conference, submitting research, or reviewing submissions, eConference
						provides the tools you need.
					</motion.p>
				</div>
			</section>

			{/* Role Cards */}
			<section className='bg-muted/30 py-16'>
				<div className='mx-auto max-w-7xl px-4'>
					<div className='grid gap-8 md:grid-cols-3'>
						{roles.map((role, index) => (
							<motion.div
								key={role.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.5, delay: index * 0.15 }}
							>
								<Card className='border-border/50 bg-card/80 hover:border-primary/30 h-full backdrop-blur transition-all hover:shadow-xl'>
									<CardHeader>
										<motion.div
											whileHover={{ scale: 1.1, rotate: 5 }}
											transition={{ type: 'spring', stiffness: 400 }}
											className='bg-primary/10 text-primary mb-4 flex h-14 w-14 items-center justify-center rounded-xl'
										>
											<role.icon className='h-7 w-7' />
										</motion.div>
										<CardTitle className='text-2xl'>{role.title}</CardTitle>
										<CardDescription className='text-primary text-base font-medium'>{role.subtitle}</CardDescription>
										<p className='text-muted-foreground mt-2'>{role.description}</p>
									</CardHeader>
									<CardContent>
										<ul className='space-y-3'>
											{role.features.map((feature, i) => (
												<motion.li
													key={feature}
													initial={{ opacity: 0, x: -10 }}
													whileInView={{ opacity: 1, x: 0 }}
													viewport={{ once: true }}
													transition={{ delay: 0.3 + i * 0.1 }}
													className='flex items-start gap-3'
												>
													<CheckCircle2 className='text-primary mt-0.5 h-5 w-5 shrink-0' />
													<span className='text-muted-foreground text-sm'>{feature}</span>
												</motion.li>
											))}
										</ul>
									</CardContent>
								</Card>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* Comparison Table */}
			<section className='py-24'>
				<div className='mx-auto max-w-4xl px-4'>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className='mb-12 text-center'
					>
						<h2 className='text-foreground text-3xl font-bold tracking-tight'>Role Capabilities</h2>
						<p className='text-muted-foreground mt-4'>See what each role can do at a glance.</p>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<Card className='overflow-hidden'>
							<div className='overflow-x-auto'>
								<table className='w-full'>
									<thead>
										<tr className='border-border bg-muted/50 border-b'>
											<th className='text-foreground px-6 py-4 text-left text-sm font-semibold'>Feature</th>
											<th className='text-foreground px-6 py-4 text-center text-sm font-semibold'>Organizer</th>
											<th className='text-foreground px-6 py-4 text-center text-sm font-semibold'>Author</th>
											<th className='text-foreground px-6 py-4 text-center text-sm font-semibold'>Reviewer</th>
										</tr>
									</thead>
									<tbody>
										{comparisons.map((row, index) => (
											<motion.tr
												key={row.feature}
												initial={{ opacity: 0 }}
												whileInView={{ opacity: 1 }}
												viewport={{ once: true }}
												transition={{ delay: 0.3 + index * 0.05 }}
												className='border-border border-b last:border-0'
											>
												<td className='text-foreground px-6 py-4 text-sm'>{row.feature}</td>
												<td className='px-6 py-4 text-center'>
													{row.organizer ? (
														<CheckCircle2 className='text-primary inline h-5 w-5' />
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</td>
												<td className='px-6 py-4 text-center'>
													{row.author ? (
														<CheckCircle2 className='text-primary inline h-5 w-5' />
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</td>
												<td className='px-6 py-4 text-center'>
													{row.reviewer ? (
														<CheckCircle2 className='text-primary inline h-5 w-5' />
													) : (
														<span className='text-muted-foreground'>—</span>
													)}
												</td>
											</motion.tr>
										))}
									</tbody>
								</table>
							</div>
						</Card>
					</motion.div>
				</div>
			</section>

			{/* CTA */}
			<section className='bg-primary/5 py-24'>
				<div className='mx-auto max-w-3xl px-4 text-center'>
					<motion.div
						initial={{ opacity: 0, scale: 0.95 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
					>
						<h2 className='text-foreground text-3xl font-bold tracking-tight sm:text-4xl'>Ready to get started?</h2>
						<p className='text-muted-foreground mt-4 text-lg'>
							Choose your role when you sign up. You can always contact support if your role needs to change.
						</p>
						<div className='mt-8 flex flex-col justify-center gap-4 sm:flex-row'>
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
								<Link href='/'>Back to Home</Link>
							</Button>
						</div>
					</motion.div>
				</div>
			</section>
		</div>
	)
}
