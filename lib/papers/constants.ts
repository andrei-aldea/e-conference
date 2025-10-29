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
