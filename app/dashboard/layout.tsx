import { AppSidebar } from '@/components/app-sidebar'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className='flex items-center p-5'>
					<SidebarTrigger className='ml-0 mt-0 shrink-0' />
				</header>
				<div className='flex-1 px-4'>{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
