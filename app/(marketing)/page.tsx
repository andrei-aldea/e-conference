import type { LucideIcon } from 'lucide-react'
import { ArrowRight, BarChart3, CalendarCheck, FileText, ShieldCheck, Users } from 'lucide-react'
import Link from 'next/link'

import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type FeatureHighlight = {
	title: string
	description: string
	icon: LucideIcon
}

type WorkflowStage = {
	title: string
	description: string
}

type PersonaHighlight = {
	role: string
	summary: string
	accent: string
}

type HeroStat = {
	label: string
	value: string
}

const featureHighlights: FeatureHighlight[] = [
	{
		title: 'Conference planning',
		description: 'Organisers create conferences, define key logistics, and monitor activity from a unified dashboard.',
		icon: CalendarCheck
	},
	{
		title: 'Paper intake',
		description: 'Authors submit papers with guided forms and can revisit their work from the dashboard at any time.',
		icon: FileText
	},
	{
		title: 'Reviewer workspace',
		description: 'Reviewers see assigned papers, update decisions, and stay aligned with programme timelines.',
		icon: Users
	},
	{
		title: 'Role-based dashboards',
		description: 'Every role receives tailored stats highlighting pending actions and recent papers.',
		icon: BarChart3
	},
	{
		title: 'Assignment tracking',
		description: 'Organisers assign reviewers, follow status changes, and keep communication clear for each paper.',
		icon: ArrowRight
	},
	{
		title: 'Secure access',
		description: 'Firebase authentication and protected APIs keep conference data safe while enabling quick sign-ins.',
		icon: ShieldCheck
	}
]

const workflowStages: WorkflowStage[] = [
	{
		title: 'Register and choose your role',
		description:
			'Sign up as an organiser, author, or reviewer to unlock the workspace that matches your responsibilities.'
	},
	{
		title: 'Set up conferences',
		description: 'Organisers publish conference details and share them with contributors in a central hub.'
	},
	{
		title: 'Submit and assign papers',
		description: 'Authors upload manuscripts while organisers connect each paper with the right reviewers.'
	},
	{
		title: 'Review and track decisions',
		description:
			'Reviewers log decisions, organisers track responses, and everyone stays prepared for the final programme.'
	}
]

const personaHighlights: PersonaHighlight[] = [
	{
		role: 'Organisers',
		summary: 'Launch conferences, monitor papers, and coordinate reviewer assignments with instant status updates.',
		accent: 'programme chairs stay in control'
	},
	{
		role: 'Authors',
		summary: 'Submit papers, revisit conference details, and follow reviewer decisions right from your dashboard.',
		accent: 'clarity on every paper'
	},
	{
		role: 'Reviewers',
		summary: 'Work through assignments, record decisions, and keep organisers informed of progress in seconds.',
		accent: 'decisions with less friction'
	}
]

const heroStats: HeroStat[] = [
	{ label: 'Roles supported', value: '3' },
	{ label: 'Realtime sync', value: 'Firebase' },
	{ label: 'Setup time', value: '< 5 min' }
]

export default function HomePage() {
	return (
		<div className='flex flex-1 flex-col bg-linear-to-b from-background via-background to-muted/40'>
			<section className='relative overflow-hidden px-4 pb-24 pt-28 sm:pb-32 sm:pt-36'>
				<div className='absolute inset-x-0 -top-40 -z-10 flex justify-center md:-top-48'>
					<div className='h-104 w-160 rounded-full bg-primary/15 blur-3xl' />
				</div>
				<div className='mx-auto flex max-w-6xl flex-col items-center gap-16 text-center lg:flex-row lg:items-start lg:text-left'>
					<div className='flex-1 space-y-8'>
						<span className='inline-flex items-center gap-2 rounded-full border border-border/80 bg-background/80 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground shadow-sm backdrop-blur'>
							<CalendarCheck className='size-4 text-primary' />
							Role-aware conference hub
						</span>
						<PageTitle className='text-balance text-4xl font-semibold tracking-tight text-foreground md:text-6xl'>
							Bring organisers, authors, and reviewers together
						</PageTitle>
						<PageDescription className='text-balance text-base text-muted-foreground md:text-lg'>
							eConference centralises conference setup, paper workflows, and reviewer feedback so every role sees what
							to do next.
						</PageDescription>
						<div className='flex flex-col items-center gap-4 sm:flex-row sm:justify-start'>
							<Button
								size='lg'
								asChild
							>
								<Link href='/signup'>
									Get started
									<ArrowRight className='size-4' />
								</Link>
							</Button>
							<Button
								variant='ghost'
								size='lg'
								asChild
							>
								<Link href='/login'>Sign in</Link>
							</Button>
						</div>
						<div className='grid w-full gap-4 sm:grid-cols-3 sm:text-left'>
							{heroStats.map((stat) => (
								<div
									key={stat.label}
									className='rounded-xl border border-border/60 bg-background/70 p-4 text-left shadow-sm backdrop-blur transition hover:-translate-y-1 hover:shadow-md'
								>
									<p className='text-sm text-muted-foreground'>{stat.label}</p>
									<p className='mt-2 text-2xl font-semibold'>{stat.value}</p>
								</div>
							))}
						</div>
					</div>
					<div className='flex-1 w-full max-w-xl'>
						<Card className='border border-border/60 bg-background/80 shadow-xl backdrop-blur-lg'>
							<CardHeader className='space-y-2'>
								<CardTitle className='text-foreground'>Live conference snapshot</CardTitle>
								<CardDescription className='text-sm text-muted-foreground'>
									Organisers watch papers roll in and keep reviewer queues balanced.
								</CardDescription>
							</CardHeader>
							<CardContent className='space-y-4 text-left'>
								<div className='rounded-lg border border-border/60 bg-muted/50 p-4'>
									<p className='text-xs font-medium uppercase text-muted-foreground'>Today</p>
									<div className='mt-2 flex items-center justify-between'>
										<span className='text-sm text-muted-foreground'>New papers</span>
										<span className='text-lg font-semibold'>8</span>
									</div>
									<div className='mt-3 h-2 w-full overflow-hidden rounded-full bg-border'>
										<div className='h-full w-[72%] rounded-full bg-primary/80' />
									</div>
								</div>
								<ul className='space-y-3 text-sm'>
									<li className='flex items-start justify-between rounded-lg border border-border/60 bg-background/70 p-3'>
										<div>
											<p className='font-medium text-foreground'>Pending reviewer responses</p>
											<p className='text-xs text-muted-foreground'>4 reviewers still need to confirm their decision.</p>
										</div>
										<span className='text-xs font-semibold uppercase text-primary'>Follow up</span>
									</li>
									<li className='flex items-start justify-between rounded-lg border border-border/60 bg-background/70 p-3'>
										<div>
											<p className='font-medium text-foreground'>Assignments ready</p>
											<p className='text-xs text-muted-foreground'>Two new papers waiting to be assigned.</p>
										</div>
										<span className='text-xs font-semibold uppercase text-primary/80'>Queue</span>
									</li>
									<li className='flex items-start justify-between rounded-lg border border-border/60 bg-background/70 p-3'>
										<div>
											<p className='font-medium text-foreground'>Author updates</p>
											<p className='text-xs text-muted-foreground'>
												Notify contributors once reviewer decisions are finalised.
											</p>
										</div>
										<span className='text-xs font-semibold uppercase text-muted-foreground'>Next</span>
									</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>
			<section className='px-4 py-20'>
				<div className='mx-auto max-w-3xl text-center'>
					<PageTitle className='text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>
						The end-to-end toolkit for conference teams
					</PageTitle>
					<PageDescription className='text-balance text-base text-muted-foreground md:text-lg'>
						Stay focused on building a memorable conference while eConference keeps papers, assignments, and dashboards
						in sync.
					</PageDescription>
				</div>
				<div className='mx-auto mt-12 grid max-w-6xl gap-6 sm:grid-cols-2 xl:grid-cols-3'>
					{featureHighlights.map(({ title, description, icon: Icon }) => (
						<Card
							key={title}
							className='group relative overflow-hidden border border-border/60 bg-background/80 shadow-sm transition hover:-translate-y-1.5 hover:shadow-xl'
						>
							<div className='absolute -right-10 top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition duration-500 group-hover:scale-110' />
							<CardHeader className='relative space-y-4'>
								<span className='inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
									<Icon className='size-5' />
								</span>
								<CardTitle className='text-xl font-semibold'>{title}</CardTitle>
								<CardDescription className='text-base text-muted-foreground'>{description}</CardDescription>
							</CardHeader>
						</Card>
					))}
				</div>
			</section>
			<section className='bg-muted/30 px-4 py-20'>
				<div className='mx-auto flex max-w-6xl flex-col gap-12 lg:flex-row lg:items-start'>
					<div className='flex-1 space-y-6 text-center lg:text-left'>
						<PageTitle className='text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>
							A guided workflow from registration to decision
						</PageTitle>
						<PageDescription className='text-balance text-base text-muted-foreground md:text-lg'>
							Each milestone is supported by tailored dashboards so organisers, authors, and reviewers stay aligned.
						</PageDescription>
					</div>
					<ol className='flex-1 space-y-4'>
						{workflowStages.map((stage, index) => (
							<li
								key={stage.title}
								className='rounded-2xl border border-border/60 bg-background/80 p-5 shadow-sm backdrop-blur'
							>
								<div className='flex items-start gap-4'>
									<span className='flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary'>
										{index + 1}
									</span>
									<div className='space-y-2 text-left'>
										<h3 className='text-lg font-semibold text-foreground'>{stage.title}</h3>
										<p className='text-sm text-muted-foreground'>{stage.description}</p>
									</div>
								</div>
							</li>
						))}
					</ol>
				</div>
			</section>
			<section className='px-4 py-20'>
				<div className='mx-auto max-w-6xl space-y-10'>
					<PageTitle className='text-center text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>
						Built for every role in your conference
					</PageTitle>
					<div className='grid gap-6 md:grid-cols-3'>
						{personaHighlights.map((persona) => (
							<Card
								key={persona.role}
								className='border border-border/60 bg-background/80 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg'
							>
								<CardHeader className='space-y-2 px-0'>
									<CardTitle className='text-xl font-semibold'>{persona.role}</CardTitle>
									<CardDescription className='text-sm text-primary/80'>{persona.accent}</CardDescription>
								</CardHeader>
								<CardContent className='space-y-3 px-0 text-sm text-muted-foreground'>
									<p>{persona.summary}</p>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			</section>
			<section className='px-4 pb-24'>
				<Card className='relative mx-auto max-w-5xl overflow-hidden border-none bg-primary text-primary-foreground shadow-xl'>
					<div className='absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl' />
					<div className='absolute -right-20 bottom-0 h-72 w-72 rounded-full bg-white/10 blur-3xl' />
					<CardHeader className='relative z-10 space-y-3 text-center'>
						<CardTitle className='text-balance text-3xl font-semibold tracking-tight md:text-4xl'>
							Ready to host your most seamless conference yet?
						</CardTitle>
						<CardDescription className='text-base text-primary-foreground/80 md:text-lg'>
							Launch your workspace, invite the rest of your committee, and have papers live before the week wraps.
						</CardDescription>
					</CardHeader>
					<CardFooter className='relative z-10 flex flex-col items-center justify-center gap-4 pb-10 sm:flex-row'>
						<Button
							variant='secondary'
							size='lg'
							asChild
						>
							<Link href='/signup'>Create your workspace</Link>
						</Button>
						<Button
							variant='ghost'
							size='lg'
							className='text-primary-foreground hover:bg-primary-foreground/10'
							asChild
						>
							<Link href='/login'>Already onboard? Sign in</Link>
						</Button>
					</CardFooter>
				</Card>
			</section>
		</div>
	)
}
