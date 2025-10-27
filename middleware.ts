import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { User } from './lib/schemas'

const publicPaths = ['/', '/login', '/signup']
const organizerPaths = ['/dashboard/conferences/new', '/dashboard/conferences/manage']

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

	// Handle role-based authorization for authenticated users
	if (currentUser) {
		try {
			const user: User = JSON.parse(currentUser)
			// If a non-organizer tries to access an organizer-only path, redirect them.
			if (user.role !== 'organizer' && organizerPaths.some((path) => pathname.startsWith(path))) {
				return NextResponse.redirect(new URL('/dashboard', request.url))
			}
		} catch (e) {
			// Invalid cookie, treat as logged out
			return NextResponse.redirect(new URL('/login', request.url))
		}
	}

	return NextResponse.next()
}

export const config = {
	matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
}
