import { Suspense } from 'react'

import { AuthProvider } from '@/components/auth/auth-provider'
import { ThemeProvider } from '@/components/theme/theme-provider'
import { ModeToggle } from '@/components/theme/theme-toggle'
import { Toaster } from '@/components/ui/sonner'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: 'eConference | Role-aware conference management',
	description:
		'Plan conferences, manage papers, and collaborate with organisers, authors, and reviewers in one workspace.'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html
			lang='en'
			suppressHydrationWarning
		>
			<head></head>
			<body className={`${geistSans.variable} ${geistMono.variable}`}>
				<Suspense fallback={null}>
					<AuthProvider>
						<main>
							<ThemeProvider
								attribute='class'
								defaultTheme='system'
								enableSystem
								disableTransitionOnChange
							>
								<div className='fixed right-5 top-5 z-50'>
									<ModeToggle />
								</div>
								{children}
								<Toaster />
							</ThemeProvider>
						</main>
					</AuthProvider>
				</Suspense>
			</body>
		</html>
	)
}
