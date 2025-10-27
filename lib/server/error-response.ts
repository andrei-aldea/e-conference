import { NextResponse } from 'next/server'

import { ApiError } from '@/lib/server/api-error'

const DEFAULT_ERROR_MESSAGE = 'Internal server error. Please try again.'

export function handleApiRouteError(error: unknown, logMessage: string) {
	if (error instanceof ApiError) {
		return NextResponse.json({ error: error.message }, { status: error.status })
	}

	console.error(logMessage, error)
	return NextResponse.json({ error: DEFAULT_ERROR_MESSAGE }, { status: 500 })
}
