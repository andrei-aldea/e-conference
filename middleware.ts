import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { PUBLIC_PATHS } from '@/lib/public-paths'

export function middleware(request: NextRequest) {
	const session = request.cookies.get('session')?.value
	const { pathname } = request.nextUrl

	const isPublicPath = PUBLIC_PATHS.includes(pathname)

	if (session && isPublicPath) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	if (!session && !isPublicPath) {
		const loginUrl = new URL('/login', request.url)
		// Store the page they were trying to access
		loginUrl.searchParams.set('redirect', pathname)
		return NextResponse.redirect(loginUrl)
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
