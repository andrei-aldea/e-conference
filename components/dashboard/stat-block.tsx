'use client'

interface StatBlockProps {
	label: string
	value: number | string
}

export function StatBlock({ label, value }: StatBlockProps) {
	return (
		<div className='rounded-lg border p-3 text-sm'>
			<p className='text-muted-foreground'>{label}</p>
			<p className='mt-2 text-2xl font-semibold'>{value}</p>
		</div>
	)
}
