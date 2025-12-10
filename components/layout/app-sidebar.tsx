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
		<Sidebar className='border-border border-r'>
			{/* Header with Logo */}
			<SidebarHeader className='border-border border-b px-3 py-4'>
				<Link
					href='/dashboard'
					className='flex items-center gap-2 px-3'
				>
					<CalendarCheck className='text-primary h-6 w-6' />
					<span className='text-lg font-bold tracking-tight'>eConference</span>
				</Link>
			</SidebarHeader>

			{/* Main Navigation */}
			<SidebarContent className='px-3 py-4'>
				<SidebarGroup>
					<SidebarGroupLabel className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
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
										<item.icon className='text-primary h-5 w-5' />
										<span>{item.name}</span>
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>

				{roleLinks.length > 0 && (
					<SidebarGroup className='mt-6'>
						<SidebarGroupLabel className='text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase'>
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
											<item.icon className='text-primary h-5 w-5' />
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
			<SidebarFooter className='border-border border-t p-4'>
				{user && (
					<div className='bg-muted mb-4 flex items-center gap-3 rounded-lg p-3'>
						<div className='bg-primary text-primary-foreground flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold'>
							{getInitials(user.name)}
						</div>
						<div className='min-w-0 flex-1'>
							<p className='truncate text-sm font-semibold'>{user.name || 'User'}</p>
							<p className='text-muted-foreground truncate text-xs'>@{user.username || 'user'}</p>
						</div>
					</div>
				)}
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => signOut({ callbackUrl: '/login' })}
							className='text-destructive hover:bg-destructive/10 hover:text-destructive h-10 px-3 text-[15px] font-medium'
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
