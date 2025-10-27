import { getAuth } from 'firebase-admin/auth'
import { type NextRequest, NextResponse } from 'next/server'

import { getFirebaseAdminApp } from '@/lib/firebase-admin'

export async function POST(request: NextRequest) {
	try {
		const authorization = request.headers.get('Authorization')
		if (authorization?.startsWith('Bearer ')) {
			const idToken = authorization.split('Bearer ')[1]
			const decodedToken = await getAuth(getFirebaseAdminApp()).verifyIdToken(idToken)

			if (decodedToken) {
				const expiresIn = 60 * 60 * 24 * 5 * 1000
				const sessionCookie = await getAuth(getFirebaseAdminApp()).createSessionCookie(idToken, { expiresIn })
				const options = {
					name: 'session',
					value: sessionCookie,
					maxAge: expiresIn,
					httpOnly: true,
					secure: process.env.NODE_ENV === 'production'
				}

				const response = NextResponse.json({ success: true }, { status: 200 })
				response.cookies.set(options)
				return response
			}
		}
	} catch (error) {
		console.error('Error creating session cookie:', error)
		return NextResponse.json({ success: false }, { status: 401 })
	}

	return NextResponse.json({ success: false }, { status: 401 })
}

export async function DELETE() {
	const response = NextResponse.json({ success: true }, { status: 200 })
	response.cookies.delete('session')
	return response
}
