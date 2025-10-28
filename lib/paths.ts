import type { User } from '@/lib/validation/schemas'

export type UserRole = User['role']

export const PUBLIC_PATHS = ['/', '/login', '/signup', '/roles', '/contact', '/conferences'] as const

const SHARED_AUTHENTICATED_PATHS = ['/dashboard', '/dashboard/account', '/dashboard/account/*'] as const

const ORGANIZER_ONLY_PATHS = [
	'/dashboard/conferences/new',
	'/dashboard/conferences/new/*',
	'/dashboard/my-conferences',
	'/dashboard/my-conferences/*'
] as const
const AUTHOR_ONLY_PATHS = [
	'/dashboard/my-papers',
	'/dashboard/my-papers/*',
	'/dashboard/submit-paper',
	'/dashboard/submit-paper/*'
] as const
const REVIEWER_ONLY_PATHS = ['/dashboard/reviewer-papers', '/dashboard/reviewer-papers/*'] as const

const ROLE_SPECIFIC_PATHS: Record<UserRole, readonly string[]> = {
	organizer: ORGANIZER_ONLY_PATHS,
	author: AUTHOR_ONLY_PATHS,
	reviewer: REVIEWER_ONLY_PATHS
}

export const ROLE_HOME_PATH: Record<UserRole, string> = {
	organizer: '/dashboard/conferences',
	author: '/dashboard/my-papers',
	reviewer: '/dashboard/reviewer-papers'
}

export function formatPathPrefix(path: string): string {
	const normalized = normalizePath(path)
	if (normalized === '/') {
		return '/'
	}
	return `${normalized}/`
}

function normalizePath(path: string): string {
	if (path === '/') {
		return '/'
	}
	return path.endsWith('/') ? path.slice(0, -1) : path
}

function matchesPath(pathname: string, candidate: string): boolean {
	const normalizedPath = normalizePath(pathname)
	if (candidate.endsWith('/*')) {
		const base = candidate.slice(0, -2)
		const normalizedBase = normalizePath(base)
		if (normalizedPath === normalizedBase) {
			return true
		}
		return pathname.startsWith(formatPathPrefix(normalizedBase))
	}
	return normalizedPath === normalizePath(candidate)
}

export function isPublicPath(pathname: string): boolean {
	const normalizedPath = normalizePath(pathname)
	return PUBLIC_PATHS.includes(normalizedPath as (typeof PUBLIC_PATHS)[number])
}

export function getAllowedPathsForRole(role: UserRole): readonly string[] {
	return [...SHARED_AUTHENTICATED_PATHS, ...ROLE_SPECIFIC_PATHS[role]]
}

export function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
	if (isPublicPath(pathname)) {
		return true
	}

	const normalizedPath = normalizePath(pathname)

	if (normalizedPath === '/dashboard/conferences' || normalizedPath.startsWith('/dashboard/conferences/')) {
		if (normalizedPath === '/dashboard/conferences/new' || normalizedPath.startsWith('/dashboard/conferences/new/')) {
			return role === 'organizer'
		}
		return true
	}

	const allowedPaths = getAllowedPathsForRole(role)
	return allowedPaths.some((candidate) => matchesPath(pathname, candidate))
}
