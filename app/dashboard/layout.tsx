import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarTrigger />
			<div className='pl-4 pr-15 mt-4 w-full'>{children}</div>
		</SidebarProvider>
	)
}
