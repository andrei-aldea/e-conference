'use client'

import { useAuth } from '@/components/auth-provider'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
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
import { ChevronUp, LayoutDashboard, PlusCircle, User2 } from 'lucide-react'
import Link from 'next/link'
import Logo from './logo'
export function AppSidebar() {
	const { user, logout } = useAuth()

	return (
		<Sidebar>
			<SidebarHeader>
				<Logo />
			</SidebarHeader>
			<hr />
			<SidebarContent>
				<SidebarGroup>
					<SidebarMenu>
						<Link href='/dashboard'>
							<SidebarMenuItem>
								<SidebarMenuButton>
									<LayoutDashboard />
									Dashboard
								</SidebarMenuButton>
							</SidebarMenuItem>
						</Link>
						{user?.role === 'organizer' && (
							<Link href='/dashboard/conferences/new'>
								<SidebarMenuItem>
									<SidebarMenuButton>
										<PlusCircle />
										New Conference
									</SidebarMenuButton>
								</SidebarMenuItem>
							</Link>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<SidebarMenuItem>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<SidebarMenuButton>
									<User2 /> {user?.name}
									<ChevronUp className='ml-auto' />
								</SidebarMenuButton>
							</DropdownMenuTrigger>
							<DropdownMenuContent
								side='top'
								className='w-[--radix-popper-anchor-width]'
							>
								<DropdownMenuItem asChild>
									<Link href='/dashboard/account'>Account</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={logout}>
									<span>Sign out</span>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
