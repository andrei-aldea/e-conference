import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

import { isPublicPath } from '@/lib/paths'

export function middleware(request: NextRequest) {
	const session = request.cookies.get('session')?.value
	const { pathname } = request.nextUrl

	const isPublic = isPublicPath(pathname)

	if (session && isPublic) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	if (!session && !isPublic) {
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
