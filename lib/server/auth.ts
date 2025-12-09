import { auth } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ApiError } from '@/lib/server/api-error'
import type { PrismaClient, User } from '@prisma/client'

export type DashboardRole = 'organizer' | 'author' | 'reviewer'

const DASHBOARD_ROLES: ReadonlyArray<DashboardRole> = ['organizer', 'author', 'reviewer']

function isDashboardRole(value: unknown): value is DashboardRole {
	return typeof value === 'string' && DASHBOARD_ROLES.includes(value as DashboardRole)
}

export interface AuthenticatedRequest {
	prisma: PrismaClient
	uid: string
	role: DashboardRole
	user: User
}

interface AuthenticateRequestOptions {
	allowedRoles?: ReadonlyArray<DashboardRole>
}

export async function authenticateRequest(options?: AuthenticateRequestOptions): Promise<AuthenticatedRequest> {
	const session = await auth()

	if (!session?.user?.id) {
		throw new ApiError(401, 'Authentication required.')
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id }
	})

	if (!user) {
		throw new ApiError(404, 'User profile not found.')
	}

	const role = user.role as DashboardRole

	if (!isDashboardRole(role)) {
		throw new ApiError(403, 'Unsupported role for this operation.')
	}

	if (options?.allowedRoles && !options.allowedRoles.includes(role)) {
		throw new ApiError(403, 'You are not allowed to perform this action.')
	}

	return {
		prisma,
		uid: user.id,
		role,
		user
	}
}
