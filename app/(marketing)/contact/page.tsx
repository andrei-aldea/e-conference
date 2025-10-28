import { Mail, MessageCircle, Phone } from 'lucide-react'
import Link from 'next/link'

import { PageDescription, PageTitle } from '@/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const contactChannels = [
	{
		icon: Mail,
		title: 'Email support',
		description: 'Drop us a message and we will respond within one business day.',
		value: 'contact@aldeaandrei.com',
		mailto: 'mailto:contact@aldeaandrei.com'
	},
	{
		icon: Phone,
		title: 'Live consultation',
		description: 'Schedule a 30-minute onboarding call with our team.',
		value: '+40 733 626 626',
		mailto: 'tel:+40733626626'
	},
	{
		icon: MessageCircle,
		title: 'Community Slack',
		description: 'Discuss workflows and share best practices with other organisers.',
		value: 'Email for an invite',
		mailto: 'mailto:contact@aldeaandrei.com?subject=Slack%20Invite'
	}
]

export default function ContactPage() {
	return (
		<div className='bg-linear-to-b from-background via-background to-muted/40 py-20'>
			<section className='mx-auto flex max-w-3xl flex-col items-center gap-6 px-4 text-center'>
				<PageTitle className='text-balance text-4xl font-semibold tracking-tight text-foreground md:text-5xl'>
					Let&apos;s build your next conference together
				</PageTitle>
				<PageDescription className='text-balance text-base text-muted-foreground md:text-lg'>
					Reach out for onboarding help, feature requests, or a walkthrough of how eConference aligns every role.
				</PageDescription>
			</section>
			<section className='mx-auto mt-12 grid max-w-6xl gap-6 px-4 lg:grid-cols-[1.1fr_1fr]'>
				<Card className='border border-border/60 bg-background/80 shadow-sm'>
					<CardHeader className='space-y-3'>
						<CardTitle className='text-2xl font-semibold text-foreground'>Message our team</CardTitle>
						<CardDescription className='text-sm text-muted-foreground'>
							Share a little about your event and we&apos;ll follow up with next steps.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<form className='space-y-4'>
							<div className='grid gap-4 md:grid-cols-2'>
								<div className='space-y-2'>
									<Label htmlFor='name'>Full name</Label>
									<Input
										id='name'
										type='text'
										placeholder='Ada Lovelace'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='email'>Work email</Label>
									<Input
										id='email'
										type='email'
										placeholder='you@organisation.org'
									/>
								</div>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='role'>Primary role</Label>
								<Input
									id='role'
									type='text'
									placeholder='Organiser'
								/>
							</div>
							<div className='space-y-2'>
								<Label htmlFor='message'>How can we help?</Label>
								<Textarea
									id='message'
									placeholder='Tell us about your conference goals, timelines, or blockers.'
									rows={5}
								/>
							</div>
							<Button type='submit'>Send message</Button>
						</form>
					</CardContent>
				</Card>
				<Card className='border border-border/60 bg-background/80 shadow-sm'>
					<CardHeader className='space-y-3'>
						<CardTitle className='text-2xl font-semibold text-foreground'>Other ways to connect</CardTitle>
						<CardDescription className='text-sm text-muted-foreground'>
							Pick the channel that fits your team&apos;s schedule.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<ul className='space-y-4'>
							{contactChannels.map(({ icon: Icon, title, description, value, mailto }) => (
								<li
									key={title}
									className='flex items-start gap-3 rounded-lg border border-border/40 bg-muted/40 p-4'
								>
									<span className='mt-1 flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
										<Icon className='size-4' />
									</span>
									<div className='space-y-1 text-sm'>
										<p className='font-medium text-foreground'>{title}</p>
										<p className='text-muted-foreground'>{description}</p>
										<Link
											href={mailto}
											className='font-medium text-primary underline-offset-4 hover:underline'
										>
											{value}
										</Link>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</section>
		</div>
	)
}
