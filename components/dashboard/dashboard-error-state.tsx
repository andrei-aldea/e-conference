'use client'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CircleAlert } from 'lucide-react'
import type { ComponentProps } from 'react'

interface DashboardErrorStateProps extends ComponentProps<'div'> {
	message: string
	onRetry?: () => void
}

export function DashboardErrorState({ message, onRetry, className, ...props }: DashboardErrorStateProps) {
	return (
		<div
			className={cn(
				'flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive',
				className
			)}
			{...props}
		>
			<div className='flex items-start gap-2'>
				<CircleAlert className='mt-0.5 size-4' />
				<span>{message}</span>
			</div>
			{onRetry ? (
				<Button
					variant='outline'
					size='sm'
					onClick={onRetry}
				>
					Try again
				</Button>
			) : null}
		</div>
	)
}
