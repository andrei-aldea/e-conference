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
		return <div className='bg-muted h-8 w-14 rounded-full' />
	}

	const isDark = theme === 'dark'

	return (
		<button
			onClick={() => setTheme(isDark ? 'light' : 'dark')}
			className='bg-muted hover:bg-muted/80 relative flex h-8 w-14 items-center rounded-full p-1 transition-colors'
			aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
		>
			<motion.div
				className='bg-background absolute flex h-6 w-6 items-center justify-center rounded-full shadow-sm'
				animate={{ x: isDark ? 24 : 0 }}
				transition={{ type: 'spring', stiffness: 500, damping: 30 }}
			>
				{isDark ? <Moon className='text-primary h-3.5 w-3.5' /> : <Sun className='text-primary h-3.5 w-3.5' />}
			</motion.div>
			<span className='sr-only'>Toggle theme</span>
		</button>
	)
}
