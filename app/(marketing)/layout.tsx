import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/layout/footer'
import { SiteHeader } from '@/components/layout/header'

export default function MarketingLayout({ children }: { children: ReactNode }) {
	return (
		<div className='flex min-h-screen flex-col bg-background'>
			<SiteHeader />
			<main className='flex-1'>{children}</main>
			<SiteFooter />
		</div>
	)
}
