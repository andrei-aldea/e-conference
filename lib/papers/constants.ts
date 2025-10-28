export const MANUSCRIPT_ALLOWED_MIME_TYPES = ['application/pdf'] as const
export const MANUSCRIPT_ALLOWED_EXTENSIONS = ['pdf'] as const

export const MANUSCRIPT_MAX_SIZE_BYTES = 10 * 1024 * 1024
export const MANUSCRIPT_MAX_SIZE_LABEL = '10 MB'

export function isAllowedManuscriptMimeType(mimeType: string | null | undefined): boolean {
	if (!mimeType) {
		return false
	}
	return MANUSCRIPT_ALLOWED_MIME_TYPES.includes(mimeType as (typeof MANUSCRIPT_ALLOWED_MIME_TYPES)[number])
}

export function isAllowedManuscriptExtension(fileName: string | null | undefined): boolean {
	if (!fileName) {
		return false
	}
	const parts = fileName.split('.')
	if (parts.length < 2) {
		return false
	}
	const extension = parts.pop()
	return MANUSCRIPT_ALLOWED_EXTENSIONS.includes(
		extension?.toLowerCase() as (typeof MANUSCRIPT_ALLOWED_EXTENSIONS)[number]
	)
}

export function formatFileSize(bytes: number): string {
	if (!Number.isFinite(bytes) || bytes < 0) {
		return '0 B'
	}
	if (bytes === 0) {
		return '0 B'
	}
	const units = ['B', 'KB', 'MB', 'GB']
	let current = bytes
	let unitIndex = 0
	while (current >= 1024 && unitIndex < units.length - 1) {
		current /= 1024
		unitIndex += 1
	}
	const formatted = current >= 10 || unitIndex === 0 ? current.toFixed(0) : current.toFixed(1)
	return `${formatted} ${units[unitIndex]}`
}
