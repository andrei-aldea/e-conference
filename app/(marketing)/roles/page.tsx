import type { LucideIcon } from 'lucide-react'
import { CalendarCog, ClipboardCheck, FileText } from 'lucide-react'
import Link from 'next/link'

import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type RoleDetail = {
	title: string
	summary: string
	icon: LucideIcon
	highlights: string[]
}

const roleDetails: RoleDetail[] = [
	{
		title: 'Organisers',
		summary: 'Set up conferences, keep assignments on track, and guide the entire review cycle.',
		icon: CalendarCog,
		highlights: [
			'Configure conference information, deadlines, and review criteria in minutes.',
			'Assign reviewers to submissions and monitor their progress in real time.',
			'Communicate outcomes to authors and keep the programme committee aligned.'
		]
	},
	{
		title: 'Authors',
		summary: 'Submit manuscripts, confirm requirements, and follow reviewer feedback without guesswork.',
		icon: FileText,
		highlights: [
			'Upload papers using structured forms with required metadata already mapped.',
			'Track submission status, reviewer decisions, and organiser announcements from one dashboard.',
			'Update files or respond to organiser requests before deadlines close.'
		]
	},
	{
		title: 'Reviewers',
		summary: 'Work through assigned papers efficiently and keep organisers informed of every decision.',
		icon: ClipboardCheck,
		highlights: [
			'View all assigned papers alongside due dates and organiser instructions.',
			'Score submissions, leave structured feedback, and flag conflicts for follow-up.',
			'Confirm recommendations so organisers always know which papers are ready for decisions.'
		]
	}
]

export default function RolesPage() {
	return (
		<div className='bg-linear-to-b from-background via-background to-muted/40 py-20'>
			<section className='mx-auto flex max-w-4xl flex-col items-center gap-6 px-4 text-center'>
				<PageTitle className='text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
					The roles that keep every conference moving
				</PageTitle>
				<PageDescription className='text-balance text-base text-muted-foreground md:text-lg'>
					From first announcement to final programme, eConference provides tailored workspaces so organisers, authors,
					and reviewers always know what to do next.
				</PageDescription>
			</section>
			<section className='mx-auto mt-12 grid max-w-6xl gap-6 px-4 md:grid-cols-3'>
				{roleDetails.map(({ title, summary, icon: Icon, highlights }) => (
					<Card
						key={title}
						className='border border-border/60 bg-background/80 shadow-sm transition hover:-translate-y-1 hover:shadow-lg'
					>
						<CardHeader className='space-y-3 text-left'>
							<span className='inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary'>
								<Icon className='size-5' />
							</span>
							<CardTitle className='text-xl font-semibold text-foreground'>{title}</CardTitle>
							<CardDescription className='text-sm text-muted-foreground'>{summary}</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className='space-y-2 text-sm text-muted-foreground'>
								{highlights.map((highlight) => (
									<li
										key={highlight}
										className='rounded-md border border-border/40 bg-muted/40 p-3'
									>
										{highlight}
									</li>
								))}
							</ul>
						</CardContent>
					</Card>
				))}
			</section>
			<section className='mx-auto mt-16 flex max-w-3xl flex-col items-center gap-6 px-4 text-center'>
				<PageTitle className='text-balance text-3xl font-semibold tracking-tight text-foreground md:text-4xl'>
					Ready to empower your team?
				</PageTitle>
				<PageDescription className='text-balance text-base text-muted-foreground md:text-lg'>
					Create an organiser account, invite reviewers, and start collecting submissions in minutes.
				</PageDescription>
				<div className='flex flex-col items-center gap-3 sm:flex-row'>
					<Button asChild>
						<Link href='/signup'>Create organiser account</Link>
					</Button>
					<Button
						variant='ghost'
						asChild
					>
						<Link href='/contact'>Talk to us</Link>
					</Button>
				</div>
			</section>
		</div>
	)
}
