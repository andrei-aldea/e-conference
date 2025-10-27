import * as React from 'react'

import { cn } from '@/lib/utils'

const defaultTitleClass = 'text-2xl font-semibold tracking-tight'
const defaultDescriptionClass = 'text-sm text-muted-foreground'

export type PageTitleProps = React.HTMLAttributes<HTMLHeadingElement>

export const PageTitle = React.forwardRef<HTMLHeadingElement, PageTitleProps>(({ className, ...props }, ref) => (
	<h1
		ref={ref}
		className={cn(defaultTitleClass, className)}
		{...props}
	/>
))

PageTitle.displayName = 'PageTitle'

export type PageDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>

export const PageDescription = React.forwardRef<HTMLParagraphElement, PageDescriptionProps>(
	({ className, ...props }, ref) => (
		<p
			ref={ref}
			className={cn(defaultDescriptionClass, className)}
			{...props}
		/>
	)
)

PageDescription.displayName = 'PageDescription'
