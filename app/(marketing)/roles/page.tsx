import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'
import { CalendarCog, ClipboardCheck, FileText } from 'lucide-react'

type RoleDetail = {
	title: string
	summary: string
	icon: LucideIcon
	highlights: string[]
}

const roleDetails: RoleDetail[] = [
	{
		title: 'Organisers',
		summary: 'Set up conferences, assign reviewers, and follow every paper from submission to decision.',
		icon: CalendarCog,
		highlights: [
			'Publish conference details with dates, descriptions, and locations in minutes.',
			'Assign reviewers to papers and monitor decision statuses as they change.',
			'Keep one view of every paper so the whole committee stays aligned.'
		]
	},
	{
		title: 'Authors',
		summary: 'Submit manuscripts, revisit conference details, and keep track of reviewer decisions.',
		icon: FileText,
		highlights: [
			'Upload papers using a guided form that captures the essentials.',
			'Track paper status and reviewer decisions from one dashboard.',
			'Update titles or resubmit manuscripts whenever changes are needed.'
		]
	},
	{
		title: 'Reviewers',
		summary: 'Work through assigned papers efficiently and keep organisers informed with timely decisions.',
		icon: ClipboardCheck,
		highlights: [
			'View all assigned papers with conference context in one place.',
			'Update your decision (pending, accepted, or declined) in just a few clicks.',
			'Confirm recommendations so organisers always know which papers are ready for the programme.'
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
		</div>
	)
}
