'use client'

import { CalendarCheck, Github, Linkedin, Twitter } from 'lucide-react'
import { motion } from 'motion/react'
import Link from 'next/link'

const footerLinks = {
	platform: [
		{ href: '/', label: 'Home' },
		{ href: '/roles', label: 'Roles' },
		{ href: '/contact', label: 'Contact' }
	],
	account: [
		{ href: '/login', label: 'Sign In' },
		{ href: '/signup', label: 'Sign Up' },
		{ href: '/dashboard', label: 'Dashboard' }
	]
}

const socialLinks = [
	{ href: 'https://twitter.com', icon: Twitter, label: 'Twitter' },
	{ href: 'https://linkedin.com', icon: Linkedin, label: 'LinkedIn' },
	{ href: 'https://github.com', icon: Github, label: 'GitHub' }
]

export function SiteFooter() {
	return (
		<footer className='border-border/50 bg-muted/20 border-t'>
			<div className='mx-auto max-w-7xl px-4 py-12'>
				<div className='grid gap-8 md:grid-cols-4'>
					{/* Brand Column */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className='md:col-span-2'
					>
						<Link
							href='/'
							className='text-foreground inline-flex items-center gap-2'
						>
							<CalendarCheck className='text-primary h-6 w-6' />
							<span className='text-lg font-bold'>eConference</span>
						</Link>
						<p className='text-muted-foreground mt-4 max-w-sm text-sm'>
							Streamline your academic conferences with role-based dashboards for organizers, authors, and reviewers.
						</p>
						<div className='mt-6 flex gap-4'>
							{socialLinks.map((social) => (
								<Link
									key={social.label}
									href={social.href}
									target='_blank'
									rel='noopener noreferrer'
									className='bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full transition-colors'
									aria-label={social.label}
								>
									<social.icon className='h-4 w-4' />
								</Link>
							))}
						</div>
					</motion.div>

					{/* Platform Links */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.1 }}
					>
						<h3 className='text-foreground text-sm font-semibold'>Platform</h3>
						<ul className='mt-4 space-y-3'>
							{footerLinks.platform.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className='text-muted-foreground hover:text-foreground text-sm transition-colors'
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</motion.div>

					{/* Account Links */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5, delay: 0.2 }}
					>
						<h3 className='text-foreground text-sm font-semibold'>Account</h3>
						<ul className='mt-4 space-y-3'>
							{footerLinks.account.map((link) => (
								<li key={link.href}>
									<Link
										href={link.href}
										className='text-muted-foreground hover:text-foreground text-sm transition-colors'
									>
										{link.label}
									</Link>
								</li>
							))}
						</ul>
					</motion.div>
				</div>

				{/* Bottom Bar */}
				<motion.div
					initial={{ opacity: 0 }}
					whileInView={{ opacity: 1 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className='border-border/50 text-muted-foreground mt-12 flex flex-col items-center justify-between gap-4 border-t pt-8 text-sm md:flex-row'
				>
					<p>© {new Date().getFullYear()} eConference. All rights reserved.</p>
					<p>
						Designed & Developed by{' '}
						<Link
							href='https://aldeaandrei.com'
							target='_blank'
							rel='noopener noreferrer'
							className='text-foreground font-medium underline-offset-4 hover:underline'
						>
							Andrei Aldea
						</Link>
					</p>
				</motion.div>
			</div>
		</footer>
	)
}
