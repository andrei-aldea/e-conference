import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className='flex h-14 items-center border-b px-6'>
					<SidebarTrigger />
				</header>
				<main className='flex-1 p-6 lg:p-8'>{children}</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
