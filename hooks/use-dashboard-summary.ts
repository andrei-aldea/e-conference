'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import type {
	DashboardGeneralStats,
	DashboardRole,
	DashboardRoleMap,
	DashboardSummaryResponse
} from '@/lib/dashboard/summary'

interface UseDashboardSummaryOptions {
	fallbackErrorMessage?: string
}

interface DashboardSummaryResult<R extends DashboardRole> {
	general: DashboardGeneralStats | null
	roleStats: DashboardRoleMap[R] | null
	isLoading: boolean
	error: string | null
	reload: () => Promise<void>
}

export function useDashboardSummary<R extends DashboardRole>(
	expectedRole: R,
	options?: UseDashboardSummaryOptions
): DashboardSummaryResult<R> {
	const [general, setGeneral] = useState<DashboardGeneralStats | null>(null)
	const [roleStats, setRoleStats] = useState<DashboardRoleMap[R] | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const isMountedRef = useRef(true)

	const fallbackMessage = options?.fallbackErrorMessage ?? 'Unable to load dashboard data. Please try again later.'

	useEffect(() => {
		isMountedRef.current = true
		return () => {
			isMountedRef.current = false
		}
	}, [])

	const load = useCallback(async () => {
		if (!isMountedRef.current) {
			return
		}

		setIsLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/dashboard')
			if (!response.ok) {
				throw new Error('Failed to fetch dashboard summary')
			}

			const payload = (await response.json()) as DashboardSummaryResponse

			if (!isMountedRef.current) {
				return
			}

			setGeneral(payload.general ?? null)

			if (payload.role && payload.role.role === expectedRole) {
				setRoleStats(payload.role as DashboardRoleMap[R])
			} else {
				setRoleStats(null)
				setError(fallbackMessage)
			}
		} catch (loadError) {
			console.error('Failed to load dashboard summary:', loadError)
			if (isMountedRef.current) {
				setGeneral(null)
				setRoleStats(null)
				setError(fallbackMessage)
			}
		} finally {
			if (isMountedRef.current) {
				setIsLoading(false)
			}
		}
	}, [expectedRole, fallbackMessage])

	useEffect(() => {
		void load()
	}, [load])

	return {
		general,
		roleStats,
		isLoading,
		error,
		reload: load
	}
}
