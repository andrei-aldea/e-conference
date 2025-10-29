import Logo from '@/components/layout/logo'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
			<div className='flex w-full max-w-sm md:max-w-2xl flex-col gap-6'>
				<div className='flex items-center gap-2 self-center font-medium'>
					<Logo />
				</div>
				{children}
				<Link
					href='/'
					className='text-foreground text-center text-sm underline-offset-4 hover:underline'
				>
					Back to landing page
				</Link>
			</div>
		</div>
	)
}
