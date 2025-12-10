'use client'

import { CalendarCheck, Menu, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { ModeToggle } from '@/components/theme/theme-toggle'
import { Button } from '@/components/ui/button'

const navItems = [
	{ href: '/', label: 'Home' },
	{ href: '/roles', label: 'Roles' },
	{ href: '/contact', label: 'Contact' }
]

export function SiteHeader() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const pathname = usePathname()

	return (
		<header className='border-border/50 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-lg'>
			<div className='mx-auto flex max-w-7xl items-center justify-between px-4 py-4'>
				{/* Logo */}
				<Link
					href='/'
					className='text-foreground flex items-center gap-2 transition hover:opacity-80'
				>
					<CalendarCheck className='text-primary h-7 w-7' />
					<span className='text-xl font-bold'>eConference</span>
				</Link>

				{/* Desktop Navigation */}
				<nav className='hidden items-center gap-8 md:flex'>
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className={`hover:text-primary text-sm font-medium transition-colors ${
								pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
							}`}
						>
							{item.label}
						</Link>
					))}
				</nav>

				{/* Desktop Actions */}
				<div className='hidden items-center gap-4 md:flex'>
					<ModeToggle />
					<Button
						variant='ghost'
						size='sm'
						asChild
					>
						<Link href='/login'>Sign In</Link>
					</Button>
					<Button
						size='sm'
						asChild
					>
						<Link href='/signup'>Get Started</Link>
					</Button>
				</div>

				{/* Mobile: Theme Toggle + Menu Button */}
				<div className='flex items-center gap-2 md:hidden'>
					<ModeToggle />
					<Button
						variant='ghost'
						size='icon'
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
						aria-label='Toggle menu'
					>
						{mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
					</Button>
				</div>
			</div>

			{/* Mobile Menu */}
			<AnimatePresence>
				{mobileMenuOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: 'auto' }}
						exit={{ opacity: 0, height: 0 }}
						transition={{ duration: 0.2 }}
						className='border-border/50 bg-background border-t md:hidden'
					>
						<div className='mx-auto max-w-7xl px-4 py-4'>
							<nav className='flex flex-col gap-4'>
								{navItems.map((item, index) => (
									<motion.div
										key={item.href}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.1 }}
									>
										<Link
											href={item.href}
											onClick={() => setMobileMenuOpen(false)}
											className={`hover:text-primary block py-2 text-lg font-medium transition-colors ${
												pathname === item.href ? 'text-foreground' : 'text-muted-foreground'
											}`}
										>
											{item.label}
										</Link>
									</motion.div>
								))}
								<hr className='border-border/50' />
								<motion.div
									initial={{ opacity: 0, x: -20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: 0.3 }}
									className='flex flex-col gap-2 pt-2'
								>
									<Button
										variant='outline'
										className='w-full justify-center'
										asChild
									>
										<Link
											href='/login'
											onClick={() => setMobileMenuOpen(false)}
										>
											Sign In
										</Link>
									</Button>
									<Button
										className='w-full justify-center'
										asChild
									>
										<Link
											href='/signup'
											onClick={() => setMobileMenuOpen(false)}
										>
											Get Started
										</Link>
									</Button>
								</motion.div>
							</nav>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	)
}
