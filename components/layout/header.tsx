import Link from 'next/link'

import Logo from '@/components/layout/logo'
import { Button } from '@/components/ui/button'

const navItems = [
	{ href: '/', label: 'Home' },
	{ href: '/roles', label: 'Roles' },
	{ href: '/contact', label: 'Contact' }
]

export function SiteHeader() {
	return (
		<header className='sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60'>
			<div className='mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3 md:flex-nowrap'>
				<Link
					href='/'
					className='flex items-center gap-2 text-foreground transition hover:opacity-90'
				>
					<Logo />
				</Link>
				<nav className='flex flex-1 flex-wrap items-center justify-center gap-4 text-sm font-medium text-muted-foreground md:justify-end'>
					{navItems.map((item) => (
						<Link
							key={item.href}
							href={item.href}
							className='transition hover:text-foreground'
						>
							{item.label}
						</Link>
					))}
				</nav>
				<div className='flex items-center gap-2'>
					<Button
						variant='ghost'
						size='sm'
						asChild
					>
						<Link href='/login'>Sign in</Link>
					</Button>
					<Button
						size='sm'
						asChild
					>
						<Link href='/signup'>Get started</Link>
					</Button>
				</div>
			</div>
		</header>
	)
}
