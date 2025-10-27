import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

const publicPaths = ['/', '/login', '/signup']

export function middleware(request: NextRequest) {
	const currentUser = request.cookies.get('user')?.value
	const { pathname } = request.nextUrl

	const isPublicPath = publicPaths.includes(pathname)

	if (currentUser && isPublicPath) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	if (!currentUser && !isPublicPath) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
