'use client'

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

import Logo from './logo'

export function AppSidebar() {
	const { data: session } = useSession()
	const user = session?.user

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
						<Link href='/dashboard/conferences'>
							<SidebarMenuItem>
								<SidebarMenuButton>
									<List />
									All Conferences
								</SidebarMenuButton>
							</SidebarMenuItem>
						</Link>
						{user?.role === 'author' && (
							<Link href='/dashboard/my-papers'>
								<SidebarMenuItem>
									<SidebarMenuButton>
										<FileText />
										My Papers
									</SidebarMenuButton>
								</SidebarMenuItem>
							</Link>
						)}
						{user?.role === 'author' && (
							<Link href='/dashboard/submit-paper'>
								<SidebarMenuItem>
									<SidebarMenuButton>
										<FilePlus />
										Submit Paper
									</SidebarMenuButton>
								</SidebarMenuItem>
							</Link>
						)}

						{user?.role === 'organizer' && (
							<Link href='/dashboard/my-conferences'>
								<SidebarMenuItem>
									<SidebarMenuButton>
										<ClipboardList />
										My Conferences
									</SidebarMenuButton>
								</SidebarMenuItem>
							</Link>
						)}
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
						{user?.role === 'reviewer' && (
							<Link href='/dashboard/reviewer-papers'>
								<SidebarMenuItem>
									<SidebarMenuButton>
										<Waypoints />
										Assigned Papers
									</SidebarMenuButton>
								</SidebarMenuItem>
							</Link>
						)}
					</SidebarMenu>
				</SidebarGroup>
			</SidebarContent>
			<SidebarFooter>
				<SidebarMenu>
					<Link href='/dashboard/account'>
						<SidebarMenuItem>
							<SidebarMenuButton>
								<User2 />
								Account
							</SidebarMenuButton>
						</SidebarMenuItem>
					</Link>
					<SidebarMenuItem onClick={() => signOut()}>
						<SidebarMenuButton>
							<LogOut />
							Log Out
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarFooter>
		</Sidebar>
	)
}
