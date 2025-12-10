'use client'

import {
	CalendarCheck,
	ClipboardList,
	FilePlus,
	FileText,
	LayoutDashboard,
	LogOut,
	PlusCircle,
	Waypoints
} from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupLabel,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '@/components/ui/sidebar'

const navigation = {
	common: [{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
	author: [
		{ name: 'My Papers', href: '/dashboard/my-papers', icon: FileText },
		{ name: 'Submit Paper', href: '/dashboard/submit-paper', icon: FilePlus }
	],
	organizer: [
		{ name: 'My Conferences', href: '/dashboard/my-conferences', icon: ClipboardList },
		{ name: 'New Conference', href: '/dashboard/conferences/new', icon: PlusCircle }
	],
	reviewer: [{ name: 'Assigned Papers', href: '/dashboard/reviewer-papers', icon: Waypoints }]
}

function getInitials(name: string | null | undefined): string {
	if (!name) return '?'
	return name.trim().charAt(0).toUpperCase()
}

export function AppSidebar() {
	const { data: session } = useSession()
	const pathname = usePathname()
	const user = session?.user
	const role = user?.role as keyof typeof navigation | undefined

	const roleLinks = role && navigation[role] ? navigation[role] : []

	return (
		<Sidebar className='border-r border-border'>
			{/* Header with Logo */}
			<SidebarHeader className='px-3 py-4 border-b border-border'>
				<Link
					href='/dashboard'
					className='flex items-center gap-2 px-3'
				>
					<CalendarCheck className='h-6 w-6 text-primary' />
					<span className='text-lg font-bold tracking-tight'>eConference</span>
				</Link>
			</SidebarHeader>

			{/* Main Navigation */}
			<SidebarContent className='px-3 py-4'>
				<SidebarGroup>
					<SidebarGroupLabel className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
						Navigation
					</SidebarGroupLabel>
					<SidebarMenu className='space-y-1'>
						{navigation.common.map((item) => (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.href}
									className='h-10 px-3 text-[15px] font-medium'
								>
									<Link href={item.href}>
										<item.icon className='h-5 w-5 text-primary' />
										<span>{item.name}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>

				{roleLinks.length > 0 && (
					<SidebarGroup className='mt-6'>
						<SidebarGroupLabel className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
							{role === 'author' ? 'Author Tools' : role === 'organizer' ? 'Organizer Tools' : 'Reviewer Tools'}
						</SidebarGroupLabel>
						<SidebarMenu className='space-y-1'>
							{roleLinks.map((item) => (
								<SidebarMenuItem key={item.href}>
									<SidebarMenuButton
										asChild
										isActive={pathname === item.href}
										className='h-10 px-3 text-[15px] font-medium'
									>
										<Link href={item.href}>
											<item.icon className='h-5 w-5 text-primary' />
											<span>{item.name}</span>
										</Link>
									</SidebarMenuButton>
								</SidebarMenuItem>
							))}
						</SidebarMenu>
					</SidebarGroup>
				)}
			</SidebarContent>

			{/* Footer with User Info */}
			<SidebarFooter className='p-4 border-t border-border'>
				{user && (
					<div className='mb-4 flex items-center gap-3 rounded-lg bg-muted p-3'>
						<div className='flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold'>
							{getInitials(user.name)}
						</div>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-semibold truncate'>{user.name || 'User'}</p>
							<p className='text-xs text-muted-foreground truncate'>@{user.username || 'user'}</p>
						</div>
					</div>
				)}
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => signOut({ callbackUrl: '/login' })}
							className='h-10 px-3 text-[15px] font-medium text-destructive hover:bg-destructive/10 hover:text-destructive'
						>
							<LogOut className='h-5 w-5' />
							<span>Log out</span>
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
