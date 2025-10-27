import { getAuth } from 'firebase-admin/auth'
import { getFirestore, type DocumentData, type Firestore } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'

import type { DashboardRole } from '@/lib/dashboard/summary'
import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin'
import { ApiError } from '@/lib/server/api-error'

const DASHBOARD_ROLES: ReadonlyArray<DashboardRole> = ['organizer', 'author', 'reviewer']

function isDashboardRole(value: unknown): value is DashboardRole {
	return typeof value === 'string' && DASHBOARD_ROLES.includes(value as DashboardRole)
}

export interface AuthenticatedRequest {
	firestore: Firestore
	uid: string
	role: DashboardRole
	user: DocumentData
}

interface AuthenticateRequestOptions {
	allowedRoles?: ReadonlyArray<DashboardRole>
}

export async function authenticateRequest(options?: AuthenticateRequestOptions): Promise<AuthenticatedRequest> {
	const cookieStore = await cookies()
	const sessionCookie = cookieStore.get('session')?.value

	if (!sessionCookie) {
		throw new ApiError(401, 'Authentication required.')
	}

	const app = getFirebaseAdminApp()
	const auth = getAuth(app)
	const decoded = await auth.verifySessionCookie(sessionCookie, true)

	const firestore = getFirestore(app)
	const userSnapshot = await firestore.collection('users').doc(decoded.uid).get()

	if (!userSnapshot.exists) {
		throw new ApiError(404, 'User profile not found.')
	}

	const userData = userSnapshot.data() as DocumentData
	const role = userData?.role

	if (!isDashboardRole(role)) {
		throw new ApiError(403, 'Unsupported role for this operation.')
	}

	if (options?.allowedRoles && !options.allowedRoles.includes(role)) {
		throw new ApiError(403, 'You are not allowed to perform this action.')
	}

	return {
		firestore,
		uid: decoded.uid,
		role,
		user: userData
	}
}
