import Logo from '@/components/layout/logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
			<div className='flex w-full max-w-sm flex-col gap-6'>
				<div className='flex items-center gap-2 self-center font-medium'>
					<Logo />
				</div>
				{children}
			</div>
			<div className='px-6 text-center text-muted-foreground text-sm max-w-sm'>
				By clicking continue, you agree to our{' '}
				<Link
					href='/terms'
					className='underline underline-offset-4'
				>
					Terms of Service
				</Link>{' '}
				and{' '}
				<Link
					href='/privacy'
					className='underline underline-offset-4'
				>
					Privacy Policy
				</Link>
				.
			</div>
		</div>
	)
}
