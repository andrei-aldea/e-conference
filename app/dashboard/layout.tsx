import { AppSidebar } from '@/components/layout/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className='flex h-12 items-center'>
					<SidebarTrigger className='text-primary hover:bg-primary/10 hover:text-primary' />
				</header>
				<main className='flex-1 p-6 lg:p-8'>{children}</main>
			</SidebarInset>
		</SidebarProvider>
	)
}
