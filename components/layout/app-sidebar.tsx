'use client'

import {
	ClipboardList,
	FilePlus,
	FileText,
	LayoutDashboard,
	List,
	LogOut,
	PlusCircle,
	User2,
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

export function AppSidebar() {
	const { data: session } = useSession()
	const pathname = usePathname()
	const role = session?.user?.role as keyof typeof navigation | undefined

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

			<SidebarFooter className='p-2'>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton
							asChild
							isActive={pathname === '/dashboard/account'}
						>
							<Link href='/dashboard/account'>
								<User2 className='h-4 w-4' />
								Account
							</Link>
						</SidebarMenuButton>
					</SidebarMenuItem>
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
