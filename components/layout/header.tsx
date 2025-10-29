import Link from 'next/link'

import Logo from '@/components/layout/logo'

const navItems = [
	{ href: '/', label: 'Home' },
	{ href: '/roles', label: 'Roles' },
	{ href: '/contact', label: 'Contact' }
]

export function SiteHeader() {
	return (
		<header className='sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur supports-backdrop-filter:bg-background/60'>
			<div className='mx-auto flex max-w-6xl flex-col items-start gap-2 px-4 py-3 md:flex-row md:items-center md:justify-between md:gap-6'>
				<Link
					href='/'
					className='flex items-center gap-2 text-foreground transition hover:opacity-90'
				>
					<Logo />
				</Link>
				<nav className='flex w-full flex-wrap text-lg px-2 items-center justify-start gap-4 font-medium text-muted-foreground md:w-auto md:flex-1 md:justify-center'>
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
			</div>
		</header>
	)
}
