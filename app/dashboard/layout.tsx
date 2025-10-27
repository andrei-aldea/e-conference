import { AppSidebar } from '@/components/app-sidebar'
import { DashboardBreadcrumbs } from '@/components/dashboard-breadcrumbs'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<SidebarProvider>
			<AppSidebar />
			<SidebarInset>
				<header className='flex items-center gap-3 border-b px-4 py-3'>
					<SidebarTrigger className='ml-0 mt-0 shrink-0' />
					<DashboardBreadcrumbs className='truncate text-sm text-muted-foreground' />
				</header>
				<div className='flex-1 px-4 py-6'>{children}</div>
			</SidebarInset>
		</SidebarProvider>
	)
}
