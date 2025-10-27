import Logo from '@/components/layout/logo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className='bg-muted flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10'>
			<div className='flex w-full max-w-sm flex-col gap-6'>
				<div className='flex items-center gap-2 self-center font-medium'>
					<Logo />
				</div>
				{children}
			</div>
		</div>
	)
}
