import { Suspense } from 'react'

import { SessionProvider } from '@/components/providers/session-provider'
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
	title: {
		default: 'eConference | Academic Conference Management',
		template: '%s | eConference'
	},
	description:
		'Plan conferences, manage paper submissions, and collaborate with organisers, authors, and reviewers in one unified platform.',
	keywords: ['conference', 'academic', 'papers', 'research', 'peer review', 'submissions'],
	authors: [{ name: 'eConference Team' }],
	metadataBase: new URL('https://e-conference.vercel.app'),
	openGraph: {
		title: 'eConference | Academic Conference Management',
		description:
			'Plan conferences, manage paper submissions, and collaborate with organisers, authors, and reviewers in one unified platform.',
		type: 'website',
		url: 'https://e-conference.vercel.app',
		locale: 'en_US',
		siteName: 'eConference',
		images: [
			{
				url: '/og-image.png',
				width: 1200,
				height: 630,
				alt: 'eConference - Academic Conference Management Platform'
			}
		]
	},
	twitter: {
		card: 'summary_large_image',
		title: 'eConference | Academic Conference Management',
		description: 'Plan conferences, manage paper submissions, and collaborate with organisers, authors, and reviewers.',
		images: ['/og-image.png']
	},
	robots: {
		index: true,
		follow: true
	}
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
					<SessionProvider>
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
					</SessionProvider>
				</Suspense>
			</body>
		</html>
	)
}
