'use client'

import { ClipboardList, FilePlus, FileText, LayoutDashboard, List, LogOut, PlusCircle, Waypoints } from 'lucide-react'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem
} from '@/components/ui/sidebar'

import Logo from './logo'

const navigation = {
	common: [
		{ name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
		{ name: 'All Conferences', href: '/dashboard/conferences', icon: List }
	],
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
		<Sidebar>
			<SidebarHeader className='p-4'>
				<Logo />
			</SidebarHeader>

			<SidebarContent className='px-2'>
				<SidebarGroup>
					<SidebarMenu>
						{navigation.common.map((item) => (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.href}
								>
									<Link href={item.href}>
										<item.icon className='h-4 w-4' />
										{item.name}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}

						{roleLinks.map((item) => (
							<SidebarMenuItem key={item.href}>
								<SidebarMenuButton
									asChild
									isActive={pathname === item.href}
								>
									<Link href={item.href}>
										<item.icon className='h-4 w-4' />
										{item.name}
									</Link>
								</SidebarMenuButton>
							</SidebarMenuItem>
						))}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>

			<SidebarFooter className='p-4'>
				{user && (
					<div className='mb-3 flex items-center gap-3'>
						<div className='flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium'>
							{getInitials(user.name)}
						</div>
						<div className='flex-1 min-w-0'>
							<p className='text-sm font-medium truncate'>{user.name || 'User'}</p>
							<p className='text-xs text-muted-foreground truncate'>@{user.username || 'user'}</p>
						</div>
					</div>
				)}
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton onClick={() => signOut({ callbackUrl: '/login' })}>
							<LogOut className='h-4 w-4' />
							Log out
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
