'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Fragment, useMemo } from 'react'

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { cn } from '@/lib/utils'

const SEGMENT_LABEL_MAP: Record<string, string> = {
	dashboard: 'Dashboard',
	conferences: 'Conferences',
	account: 'Account',
	login: 'Login',
	signup: 'Sign Up',
	new: 'New',
	settings: 'Settings',
	assign: 'Assign',
	'assign-reviewers': 'Assign Reviewers',
	'submit-paper': 'Submit Paper',
	privacy: 'Privacy Policy',
	terms: 'Terms of Service',
	legal: 'Legal',
	auth: 'Auth'
}

function formatSegmentLabel(segment: string) {
	const lowered = segment.toLowerCase()
	if (SEGMENT_LABEL_MAP[lowered]) {
		return SEGMENT_LABEL_MAP[lowered]
	}

	if (/^[a-z0-9]{12,}$/i.test(segment) && !segment.includes('-') && !segment.includes('_')) {
		return 'Details'
	}

	return (
		segment
			.replace(/[-_]/g, ' ')
			.replace(/\b\w/g, (char) => char.toUpperCase())
			.trim() || 'Home'
	)
}

export function DashboardBreadcrumbs({ className }: { className?: string }) {
	const pathname = usePathname() || '/'

	const segments = useMemo(() => pathname.split('/').filter(Boolean), [pathname])

	const items = useMemo(() => {
		if (segments.length === 0) {
			return [{ href: '/', label: 'Home' }]
		}

		return segments.map((segment, index) => ({
			href: `/${segments.slice(0, index + 1).join('/')}`,
			label: formatSegmentLabel(segment)
		}))
	}, [segments])

	if (items.length === 0) {
		return null
	}

	return (
		<Breadcrumb className={cn('flex-1 min-w-0', className)}>
			<BreadcrumbList>
				{items.map((item, index) => (
					<Fragment key={item.href}>
						<BreadcrumbItem>
							{index < items.length - 1 ? (
								<BreadcrumbLink asChild>
									<Link href={item.href}>{item.label}</Link>
								</BreadcrumbLink>
							) : (
								<BreadcrumbPage>{item.label}</BreadcrumbPage>
							)}
						</BreadcrumbItem>
						{index < items.length - 1 && <BreadcrumbSeparator />}
					</Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	)
}
