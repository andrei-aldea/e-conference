import Link from 'next/link'

import Logo from '@/components/layout/logo'

const quickLinks = [
	{ href: '/', label: 'Home' },
	{ href: '/roles', label: 'Roles' },
	{ href: '/contact', label: 'Contact' }
]

const supportLinks = [
	{ href: '/login', label: 'Log in' },
	{ href: '/signup', label: 'Sign up' },
	{ href: '/dashboard', label: 'Dashboard' }
]

export function SiteFooter() {
	return (
		<footer className='border-t border-border/60 bg-muted/20'>
			<div className='mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-[1.4fr_1fr_1fr]'>
				<div className='space-y-4 text-sm text-muted-foreground'>
					<Link
						href='/'
						className='inline-flex items-center gap-2 text-foreground transition hover:opacity-90'
					>
						<Logo />
					</Link>
					<p>
						eConference keeps organisers, authors, and reviewers on the same page with role-based dashboards and
						streamlined workflows.
					</p>
					<p>
						Email us at{' '}
						<Link
							href='mailto:contact@aldeaandrei.com'
							className='font-medium text-foreground underline-offset-4 hover:underline'
						>
							contact@aldeaandrei.com
						</Link>
					</p>
				</div>
				<div>
					<h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Quick links</h3>
					<ul className='mt-4 space-y-2 text-sm text-muted-foreground'>
						{quickLinks.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									className='transition hover:text-foreground'
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
				<div>
					<h3 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>Log in & Sign up</h3>
					<ul className='mt-4 space-y-2 text-sm text-muted-foreground'>
						{supportLinks.map((link) => (
							<li key={link.href}>
								<Link
									href={link.href}
									className='transition hover:text-foreground'
								>
									{link.label}
								</Link>
							</li>
						))}
					</ul>
				</div>
			</div>
			<div className='border-t border-border/60 bg-muted/10'>
				<div className='mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-6 text-center text-xs text-muted-foreground md:flex-row md:text-left'>
					<p>&copy; {new Date().getFullYear()} eConference. All rights reserved.</p>
					<p>
						Designed & Developed by{' '}
						<Link
							href='https://aldeaandrei.com'
							target='_blank'
							rel='noopener noreferrer'
							className='font-medium text-foreground underline-offset-4 hover:underline'
						>
							Andrei Aldea
						</Link>
						.
					</p>
				</div>
			</div>
		</footer>
	)
}
