import { cn } from '@/lib/utils'
import * as React from 'react'

export function PageHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn('mb-8', className)}
			{...props}
		>
			{children}
		</div>
	)
}

export function PageTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h1
			className={cn('text-2xl font-semibold tracking-tight', className)}
			{...props}
		/>
	)
}

export function PageDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn('text-muted-foreground mt-1', className)}
			{...props}
		/>
	)
}
