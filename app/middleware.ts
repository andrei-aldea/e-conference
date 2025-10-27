import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

// The public routes that do not require authentication
const publicPaths = ['/', '/login', '/signup']

export function middleware(request: NextRequest) {
	const currentUser = request.cookies.get('user')?.value
	const { pathname } = request.nextUrl

	const isPublicPath = publicPaths.includes(pathname)

	// If the user is authenticated and tries to access a public page,
	// redirect to the dashboard.
	if (currentUser && isPublicPath) {
		return NextResponse.redirect(new URL('/dashboard', request.url))
	}

	// If the user is not authenticated and tries to access a protected page, redirect to login.
	if (!currentUser && !isPublicPath) {
		return NextResponse.redirect(new URL('/login', request.url))
	}

	return NextResponse.next()
}

export const config = {
	// Match all paths except for static files and the Next.js internal directory.
	matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)']
}
