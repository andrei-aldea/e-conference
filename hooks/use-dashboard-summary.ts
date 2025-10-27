'use client'

import { useEffect, useState } from 'react'

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
}

export function useDashboardSummary<R extends DashboardRole>(
	expectedRole: R,
	options?: UseDashboardSummaryOptions
): DashboardSummaryResult<R> {
	const [general, setGeneral] = useState<DashboardGeneralStats | null>(null)
	const [roleStats, setRoleStats] = useState<DashboardRoleMap[R] | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fallbackMessage = options?.fallbackErrorMessage ?? 'Unable to load dashboard data. Please try again later.'

	useEffect(() => {
		let isMounted = true

		async function load() {
			setIsLoading(true)
			setError(null)

			try {
				const response = await fetch('/api/dashboard')
				if (!response.ok) {
					throw new Error('Failed to fetch dashboard summary')
				}

				const payload = (await response.json()) as DashboardSummaryResponse

				if (!isMounted) {
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
				if (isMounted) {
					setGeneral(null)
					setRoleStats(null)
					setError(fallbackMessage)
				}
			} finally {
				if (isMounted) {
					setIsLoading(false)
				}
			}
		}

		void load()

		return () => {
			isMounted = false
		}
	}, [expectedRole, fallbackMessage])

	return {
		general,
		roleStats,
		isLoading,
		error
	}
}
