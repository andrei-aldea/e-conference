import Logo from '@/components/layout/logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='bg-background flex min-h-svh flex-col items-center justify-center p-6 md:p-10'>
			<div className='flex w-full max-w-sm flex-col gap-4'>
				<div className='mb-4 flex items-center justify-center'>
					<Logo />
				</div>
				{children}
				<Link
					href='/'
					className='text-muted-foreground hover:text-foreground text-center text-sm transition-colors'
				>
					Back to landing page
				</Link>
			</div>
		</div>
	)
}
