'use client'

import { Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { useSyncExternalStore } from 'react'

// Hydration-safe mounted check
const emptySubscribe = () => () => {}
const getSnapshot = () => true
const getServerSnapshot = () => false

function useMounted() {
	return useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot)
}

export function ModeToggle() {
	const { theme, setTheme } = useTheme()
	const mounted = useMounted()

	if (!mounted) {
		return <div className='h-8 w-14 rounded-full bg-muted' />
	}

	const isDark = theme === 'dark'

	return (
		<button
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className='relative flex h-8 w-14 items-center rounded-full bg-muted p-1 transition-colors hover:bg-muted/80'
			aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
		>
			<motion.div
				className='absolute flex h-6 w-6 items-center justify-center rounded-full bg-background shadow-sm'
				animate={{ x: isDark ? 24 : 0 }}
				transition={{ type: 'spring', stiffness: 500, damping: 30 }}
			>
				{isDark ? <Moon className='h-3.5 w-3.5 text-primary' /> : <Sun className='h-3.5 w-3.5 text-primary' />}
			</motion.div>
			<span className='sr-only'>Toggle theme</span>
		</button>
	)
}
