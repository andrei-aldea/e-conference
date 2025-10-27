import type { Timestamp } from 'firebase-admin/firestore'

export function chunkArray<T>(items: T[], size: number): T[][] {
	const result: T[][] = []
	for (let index = 0; index < items.length; index += size) {
		result.push(items.slice(index, index + size))
	}
	return result
}

export function toIsoString(value: unknown): string | null {
	if (!value) {
		return null
	}

	if (typeof value === 'string') {
		return value
	}

	if (value instanceof Date) {
		return value.toISOString()
	}

	if (typeof value === 'object' && 'toDate' in value && typeof value.toDate === 'function') {
		try {
			return (value as Timestamp).toDate().toISOString()
		} catch (error) {
			console.warn('Failed to convert Firestore timestamp to ISO string:', error)
			return null
		}
	}

	return null
}
