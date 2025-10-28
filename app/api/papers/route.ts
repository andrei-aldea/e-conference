import { FieldValue, Timestamp, type DocumentData, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'
import { NextResponse, type NextRequest } from 'next/server'
import { randomUUID } from 'node:crypto'
import { ZodError } from 'zod'

import { getFirebaseAdminApp } from '@/lib/firebase/firebase-admin'
import {
	MANUSCRIPT_MAX_SIZE_BYTES,
	MANUSCRIPT_MAX_SIZE_LABEL,
	isAllowedManuscriptExtension,
	isAllowedManuscriptMimeType
} from '@/lib/papers/constants'
import { DEFAULT_REVIEWER_DECISION, extractReviewerStatuses } from '@/lib/reviewer/status'
import { ApiError } from '@/lib/server/api-error'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'
import { toIsoString } from '@/lib/server/utils'
import {
	paperAuthorUpdateSchema,
	paperFormSchema,
	paperReviewerAssignmentSchema,
	reviewerStatusUpdateSchema,
	type ReviewerDecision
} from '@/lib/validation/schemas'

const COLLECTIONS = {
	PAPERS: 'papers',
	USERS: 'users',
	CONFERENCES: 'conferences'
} as const

const DEFAULT_STORAGE_BUCKET =
	process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? null

interface PaperFilePayload {
	name: string
	size: number | null
	contentType: string | null
	downloadUrl: string | null
	uploadedAt: string | null
}

function buildDownloadUrl(
	bucketName: string | null | undefined,
	storagePath: string | null | undefined,
	downloadToken: string | null | undefined
): string | null {
	if (!bucketName || !storagePath || !downloadToken) {
		return null
	}
	const encodedPath = encodeURIComponent(storagePath)
	return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${downloadToken}`
}

function deriveFileNames(file: File): { originalName: string; storageName: string } {
	const rawName = typeof file.name === 'string' ? file.name.trim() : ''
	const originalName = rawName.length > 0 ? rawName : 'manuscript.pdf'
	const baseName = originalName.replace(/\.[^/.]+$/, '')
	const normalizedBase = baseName
		.replace(/[^a-zA-Z0-9_-]+/g, '-')
		.replace(/-+/g, '-')
		.replace(/^-+|-+$/g, '')
		.toLowerCase()
	const fallbackBase = normalizedBase.length > 0 ? normalizedBase : 'manuscript'
	return {
		originalName,
		storageName: `${fallbackBase}.pdf`
	}
}

function extractPaperFilePayload(raw: unknown, uploadedAtRaw: unknown): PaperFilePayload | null {
	if (!raw || typeof raw !== 'object') {
		return null
	}
	const data = raw as Record<string, unknown>
	const storagePath = typeof data.storagePath === 'string' ? data.storagePath : null
	const storageBucket = typeof data.storageBucket === 'string' ? data.storageBucket : DEFAULT_STORAGE_BUCKET
	const downloadToken = typeof data.downloadToken === 'string' ? data.downloadToken : null
	const size = typeof data.size === 'number' ? data.size : null
	const contentType = typeof data.contentType === 'string' ? data.contentType : null
	const nameCandidate =
		typeof data.originalName === 'string' && data.originalName.trim().length > 0
			? data.originalName.trim()
			: typeof data.name === 'string'
			? data.name
			: 'manuscript.pdf'
	return {
		name: nameCandidate,
		size,
		contentType,
		downloadUrl: buildDownloadUrl(storageBucket, storagePath, downloadToken),
		uploadedAt: toIsoString(uploadedAtRaw)
	}
}

async function fetchDocumentsByIds(
	firestore: Firestore,
	collection: string,
	ids: Set<string>
): Promise<Record<string, DocumentData>> {
	if (ids.size === 0) {
		return {}
	}

	const snapshots = await Promise.all([...ids].map((id) => firestore.collection(collection).doc(id).get()))
	return snapshots.reduce<Record<string, DocumentData>>((acc, snapshot) => {
		if (snapshot.exists) {
			acc[snapshot.id] = snapshot.data() as DocumentData
		}
		return acc
	}, {})
}

export async function GET(request: NextRequest) {
	try {
		const scope = request.nextUrl.searchParams.get('scope') ?? 'author'
		const { firestore, uid, role } = await authenticateRequest()

		if (scope === 'reviewer') {
			if (role !== 'reviewer') {
				throw new ApiError(403, 'Only reviewers can load assigned papers.')
			}

			const snapshot = await firestore.collection(COLLECTIONS.PAPERS).where('reviewers', 'array-contains', uid).get()

			const authorIds = new Set<string>()
			const conferenceIds = new Set<string>()
			const reviewerIds = new Set<string>()
			const papers = snapshot.docs.map((doc) => {
				const data = doc.data() as DocumentData
				const authorId = typeof data.authorId === 'string' ? data.authorId : null
				const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
				const reviewerAssignments = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
				const reviewerStatuses = extractReviewerStatuses(data.reviewerStatuses)
				const file = extractPaperFilePayload(data.file, data.fileUploadedAt)

				if (authorId) {
					authorIds.add(authorId)
				}
				if (conferenceId) {
					conferenceIds.add(conferenceId)
				}
				reviewerAssignments.forEach((reviewerId) => reviewerIds.add(reviewerId))

				return {
					id: doc.id,
					title: typeof data.title === 'string' ? (data.title as string) : 'Untitled paper',
					authorId,
					conferenceId,
					reviewerIds: reviewerAssignments,
					reviewerStatuses,
					status: reviewerStatuses[uid] ?? DEFAULT_REVIEWER_DECISION,
					createdAt: toIsoString(data.createdAt),
					file
				}
			})

			const [authorLookup, conferenceLookup, reviewerLookup] = await Promise.all([
				fetchDocumentsByIds(firestore, COLLECTIONS.USERS, authorIds),
				fetchDocumentsByIds(firestore, COLLECTIONS.CONFERENCES, conferenceIds),
				fetchDocumentsByIds(firestore, COLLECTIONS.USERS, reviewerIds)
			])

			papers.sort((a, b) => {
				const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
				const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
				return bDate - aDate
			})

			const payload = papers.map((paper) => ({
				id: paper.id,
				title: paper.title,
				author: paper.authorId
					? {
							id: paper.authorId,
							name:
								typeof authorLookup[paper.authorId]?.name === 'string'
									? (authorLookup[paper.authorId]?.name as string)
									: 'Author'
					  }
					: { id: 'unknown', name: 'Author' },
				conference: paper.conferenceId
					? {
							id: paper.conferenceId,
							name:
								typeof conferenceLookup[paper.conferenceId]?.name === 'string'
									? (conferenceLookup[paper.conferenceId]?.name as string)
									: 'Conference'
					  }
					: { id: 'unknown', name: 'Conference' },
				status: paper.status,
				reviewers: paper.reviewerIds.map((reviewerId) => ({
					id: reviewerId,
					name:
						typeof reviewerLookup[reviewerId]?.name === 'string'
							? (reviewerLookup[reviewerId]?.name as string)
							: 'Reviewer',
					status: paper.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
				})),
				createdAt: paper.createdAt,
				file: paper.file
			}))

			return NextResponse.json({ papers: payload })
		}

		if (role !== 'author') {
			throw new ApiError(403, 'Only authors can view submitted papers.')
		}

		const snapshot = await firestore.collection(COLLECTIONS.PAPERS).where('authorId', '==', uid).get()

		const reviewerIds = new Set<string>()
		const conferenceIds = new Set<string>()
		const papers = snapshot.docs.map((doc) => {
			const data = doc.data() as DocumentData
			const reviewers = Array.isArray(data.reviewers) ? (data.reviewers as string[]) : []
			reviewers.forEach((reviewerId) => reviewerIds.add(reviewerId))

			const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
			if (conferenceId) {
				conferenceIds.add(conferenceId)
			}

			return {
				id: doc.id,
				title: typeof data.title === 'string' ? (data.title as string) : 'Untitled paper',
				reviewers,
				reviewerStatuses: extractReviewerStatuses(data.reviewerStatuses),
				conferenceId,
				createdAt: toIsoString(data.createdAt),
				file: extractPaperFilePayload(data.file, data.fileUploadedAt)
			}
		})

		const [reviewerLookup, conferenceLookup] = await Promise.all([
			fetchDocumentsByIds(firestore, COLLECTIONS.USERS, reviewerIds),
			fetchDocumentsByIds(firestore, COLLECTIONS.CONFERENCES, conferenceIds)
		])

		papers.sort((a, b) => {
			const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return bDate - aDate
		})

		const payload = papers.map((paper) => ({
			id: paper.id,
			title: paper.title,
			conferenceId: paper.conferenceId,
			conference: paper.conferenceId
				? {
						id: paper.conferenceId,
						name:
							typeof conferenceLookup[paper.conferenceId]?.name === 'string'
								? (conferenceLookup[paper.conferenceId]?.name as string)
								: 'Conference'
				  }
				: null,
			reviewers: paper.reviewers.map((reviewerId) => ({
				id: reviewerId,
				name:
					typeof reviewerLookup[reviewerId]?.name === 'string'
						? (reviewerLookup[reviewerId]?.name as string)
						: 'Reviewer',
				status: paper.reviewerStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			})),
			createdAt: paper.createdAt,
			file: paper.file
		}))

		return NextResponse.json({ papers: payload })
	} catch (error) {
		return handleApiRouteError(error, 'Failed to list papers:')
	}
}

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const rawTitle = formData.get('title')
		const rawConferenceId = formData.get('conferenceId')
		const fileEntry = formData.get('file')

		const parsed = paperFormSchema.safeParse({
			title: typeof rawTitle === 'string' ? rawTitle : '',
			conferenceId: typeof rawConferenceId === 'string' ? rawConferenceId : ''
		})

		if (!parsed.success) {
			throw new ApiError(400, 'Invalid paper payload.')
		}

		if (!(fileEntry instanceof File)) {
			throw new ApiError(400, 'A PDF manuscript is required.')
		}

		if (fileEntry.size === 0) {
			throw new ApiError(400, 'The uploaded manuscript is empty.')
		}

		const mimeType = fileEntry.type ?? ''
		const mimeAllowed = isAllowedManuscriptMimeType(mimeType)
		const extensionAllowed = isAllowedManuscriptExtension(fileEntry.name)

		if (!mimeAllowed && !extensionAllowed) {
			throw new ApiError(400, 'Only PDF manuscripts are supported at this time.')
		}

		if (fileEntry.size > MANUSCRIPT_MAX_SIZE_BYTES) {
			throw new ApiError(413, `The manuscript exceeds the ${MANUSCRIPT_MAX_SIZE_LABEL} size limit.`)
		}

		const { title, conferenceId } = parsed.data
		const { firestore, uid, role } = await authenticateRequest()

		if (role !== 'author') {
			throw new ApiError(403, 'Only authors can submit papers.')
		}

		const conferenceRef = firestore.collection(COLLECTIONS.CONFERENCES).doc(conferenceId)
		const conferenceSnapshot = await conferenceRef.get()

		if (!conferenceSnapshot.exists) {
			throw new ApiError(404, 'Selected conference does not exist.')
		}

		const reviewersSnapshot = await firestore.collection(COLLECTIONS.USERS).where('role', '==', 'reviewer').get()
		const reviewerIds = reviewersSnapshot.docs.map((doc) => doc.id).filter((reviewerId) => reviewerId !== uid)

		if (reviewerIds.length < 2) {
			throw new ApiError(503, 'Not enough reviewers available. Please contact an organizer.')
		}

		const assignedReviewerIds = pickRandomSample(reviewerIds, 2)
		const reviewerStatuses = assignedReviewerIds.reduce<Record<string, ReviewerDecision>>((acc, reviewerId) => {
			acc[reviewerId] = DEFAULT_REVIEWER_DECISION
			return acc
		}, {})

		const app = getFirebaseAdminApp()
		const paperRef = firestore.collection(COLLECTIONS.PAPERS).doc()
		const { originalName, storageName } = deriveFileNames(fileEntry)
		const storagePath = `${COLLECTIONS.PAPERS}/${paperRef.id}/${storageName}`
		const downloadToken = randomUUID()
		const fileBuffer = Buffer.from(await fileEntry.arrayBuffer())
		const contentType = mimeAllowed ? mimeType : 'application/pdf'
		const bucket = getStorage(app).bucket()
		const bucketName = bucket.name || DEFAULT_STORAGE_BUCKET

		if (!bucketName) {
			throw new ApiError(500, 'Storage bucket is not configured. Please contact an administrator.')
		}

		try {
			await bucket.file(storagePath).save(fileBuffer, {
				metadata: {
					contentType,
					metadata: {
						firebaseStorageDownloadTokens: downloadToken,
						originalName
					}
				}
			})
		} catch (uploadError) {
			console.error('Failed to upload manuscript to storage:', uploadError)
			const message =
				uploadError &&
				typeof uploadError === 'object' &&
				'code' in uploadError &&
				(uploadError as { code?: number }).code === 404
					? `Storage bucket "${bucketName}" is not available. Please contact an administrator.`
					: 'Failed to upload manuscript. Please try again.'
			throw new ApiError(500, message)
		}

		const timestamp = Timestamp.now()

		await paperRef.set({
			title,
			authorId: uid,
			reviewers: assignedReviewerIds,
			reviewerStatuses,
			conferenceId,
			createdAt: timestamp,
			fileUploadedAt: timestamp,
			file: {
				name: storageName,
				originalName,
				size: fileEntry.size,
				contentType,
				storagePath,
				storageBucket: bucketName,
				downloadToken
			}
		})

		try {
			const batch = firestore.batch()
			batch.set(conferenceRef, { papers: FieldValue.arrayUnion(paperRef.id) }, { merge: true })
			assignedReviewerIds.forEach((reviewerId) => {
				const reviewerRef = firestore.collection(COLLECTIONS.USERS).doc(reviewerId)
				batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(paperRef.id) }, { merge: true })
			})
			await batch.commit()
		} catch (commitError) {
			await Promise.all([
				paperRef.delete().catch((error) => console.error('Failed to clean up paper after commit failure:', error)),
				bucket
					.file(storagePath)
					.delete({ ignoreNotFound: true })
					.catch((error) => console.error('Failed to remove uploaded manuscript after commit failure:', error))
			])
			throw commitError
		}

		return NextResponse.json({ success: true }, { status: 201 })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid paper payload.' }, { status: 400 })
		}

		return handleApiRouteError(error, 'Failed to submit paper:')
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const rawPayload = await request.json()
		const statusPayload = reviewerStatusUpdateSchema.safeParse(rawPayload)
		const assignmentPayload = paperReviewerAssignmentSchema.safeParse(rawPayload)
		const { firestore, uid, role } = await authenticateRequest()

		if (!statusPayload.success && !assignmentPayload.success) {
			throw new ApiError(400, 'Invalid update payload.')
		}

		if (statusPayload.success) {
			if (role !== 'reviewer') {
				throw new ApiError(403, 'Only reviewers can update paper statuses.')
			}

			const { paperId, status } = statusPayload.data
			const paperRef = firestore.collection(COLLECTIONS.PAPERS).doc(paperId)
			const paperSnapshot = await paperRef.get()

			if (!paperSnapshot.exists) {
				throw new ApiError(404, 'Paper not found.')
			}

			const paperData = paperSnapshot.data() as DocumentData
			const assignedReviewers = Array.isArray(paperData.reviewers) ? (paperData.reviewers as string[]) : []

			if (!assignedReviewers.includes(uid)) {
				throw new ApiError(403, 'You are not assigned to this paper.')
			}

			await paperRef.set(
				{
					reviewerStatuses: { [uid]: status },
					updatedAt: FieldValue.serverTimestamp()
				},
				{ merge: true }
			)

			return NextResponse.json({ success: true })
		}

		if (!assignmentPayload.success) {
			throw new ApiError(400, 'Invalid update payload.')
		}

		if (role !== 'organizer') {
			throw new ApiError(403, 'Only organizers can update reviewer assignments.')
		}

		const { paperId, reviewerIds } = assignmentPayload.data
		const uniqueReviewerIds = Array.from(new Set<string>(reviewerIds))

		if (uniqueReviewerIds.length === 0) {
			throw new ApiError(400, 'At least one reviewer must be selected.')
		}

		const paperRef = firestore.collection(COLLECTIONS.PAPERS).doc(paperId)
		const paperSnapshot = await paperRef.get()

		if (!paperSnapshot.exists) {
			throw new ApiError(404, 'Paper not found.')
		}

		const paperData = paperSnapshot.data() as DocumentData
		const previousReviewerIds = Array.isArray(paperData.reviewers) ? (paperData.reviewers as string[]) : []
		const existingStatuses = extractReviewerStatuses(paperData.reviewerStatuses)

		const reviewerDocs = await firestore.getAll(
			...uniqueReviewerIds.map((reviewerId) => firestore.collection(COLLECTIONS.USERS).doc(reviewerId))
		)

		reviewerDocs.forEach((docSnapshot) => {
			if (!docSnapshot.exists) {
				throw new ApiError(400, 'One or more reviewers were not found.')
			}

			const reviewerData = docSnapshot.data()
			if (reviewerData?.role !== 'reviewer') {
				throw new ApiError(400, 'Invalid reviewer selection.')
			}
		})

		const updatedStatuses = uniqueReviewerIds.reduce<Record<string, ReviewerDecision>>((acc, reviewerId) => {
			acc[reviewerId] = existingStatuses[reviewerId] ?? DEFAULT_REVIEWER_DECISION
			return acc
		}, {})

		const addedReviewerIds = uniqueReviewerIds.filter((reviewerId) => !previousReviewerIds.includes(reviewerId))
		const removedReviewerIds = previousReviewerIds.filter((reviewerId) => !uniqueReviewerIds.includes(reviewerId))

		const batch = firestore.batch()
		batch.set(
			paperRef,
			{
				reviewers: uniqueReviewerIds,
				reviewerStatuses: updatedStatuses,
				updatedAt: FieldValue.serverTimestamp()
			},
			{ merge: true }
		)

		addedReviewerIds.forEach((reviewerId) => {
			const reviewerRef = firestore.collection(COLLECTIONS.USERS).doc(reviewerId)
			batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(paperId) }, { merge: true })
		})

		removedReviewerIds.forEach((reviewerId) => {
			const reviewerRef = firestore.collection(COLLECTIONS.USERS).doc(reviewerId)
			batch.set(reviewerRef, { assignedPapers: FieldValue.arrayRemove(paperId) }, { merge: true })
		})

		await batch.commit()

		return NextResponse.json({ success: true })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid update payload.' }, { status: 400 })
		}

		return handleApiRouteError(error, 'Failed to update paper:')
	}
}

export async function PUT(request: NextRequest) {
	try {
		const formData = await request.formData()
		const rawPaperId = formData.get('paperId')
		const rawTitle = formData.get('title')
		const fileEntry = formData.get('file')

		if (fileEntry !== null && !(fileEntry instanceof File)) {
			throw new ApiError(400, 'Invalid manuscript upload.')
		}

		const parsed = paperAuthorUpdateSchema.safeParse({
			paperId: typeof rawPaperId === 'string' ? rawPaperId : '',
			title: typeof rawTitle === 'string' && rawTitle.trim().length > 0 ? rawTitle.trim() : undefined
		})

		if (!parsed.success) {
			throw new ApiError(400, 'Invalid paper update payload.')
		}

		const hasNewFile = fileEntry instanceof File
		const { paperId, title } = parsed.data

		if (!hasNewFile && !title) {
			throw new ApiError(400, 'Provide a new title or manuscript to update the paper.')
		}

		const { firestore, uid, role } = await authenticateRequest()

		if (role !== 'author') {
			throw new ApiError(403, 'Only authors can update papers.')
		}

		const paperRef = firestore.collection(COLLECTIONS.PAPERS).doc(paperId)
		const paperSnapshot = await paperRef.get()

		if (!paperSnapshot.exists) {
			throw new ApiError(404, 'Paper not found.')
		}

		const paperData = paperSnapshot.data() as DocumentData

		if (paperData.authorId !== uid) {
			throw new ApiError(403, 'You can only update your own papers.')
		}

		const existingFile =
			typeof paperData.file === 'object' && paperData.file !== null ? (paperData.file as Record<string, unknown>) : null
		const previousStoragePath =
			existingFile && typeof existingFile.storagePath === 'string' ? existingFile.storagePath : null
		const previousBucketName =
			existingFile && typeof existingFile.storageBucket === 'string' ? existingFile.storageBucket : null

		const updatePayload: Record<string, unknown> = {
			updatedAt: FieldValue.serverTimestamp()
		}

		if (title) {
			updatePayload.title = title
		}

		let newFileDescriptor: { storagePath: string; bucketName: string } | null = null

		if (hasNewFile && fileEntry) {
			if (fileEntry.size === 0) {
				throw new ApiError(400, 'The uploaded manuscript is empty.')
			}

			const mimeType = fileEntry.type ?? ''
			const mimeAllowed = isAllowedManuscriptMimeType(mimeType)
			const extensionAllowed = isAllowedManuscriptExtension(fileEntry.name)

			if (!mimeAllowed && !extensionAllowed) {
				throw new ApiError(400, 'Only PDF manuscripts are supported at this time.')
			}

			if (fileEntry.size > MANUSCRIPT_MAX_SIZE_BYTES) {
				throw new ApiError(413, `The manuscript exceeds the ${MANUSCRIPT_MAX_SIZE_LABEL} size limit.`)
			}

			const { originalName, storageName } = deriveFileNames(fileEntry)
			const storagePath = `${COLLECTIONS.PAPERS}/${paperRef.id}/${Date.now()}-${storageName}`
			const downloadToken = randomUUID()
			const contentType = mimeAllowed ? mimeType : 'application/pdf'
			const fileBuffer = Buffer.from(await fileEntry.arrayBuffer())
			const app = getFirebaseAdminApp()
			const storage = getStorage(app)
			const bucket = storage.bucket()
			const bucketName = bucket.name || DEFAULT_STORAGE_BUCKET

			if (!bucketName) {
				throw new ApiError(500, 'Storage bucket is not configured. Please contact an administrator.')
			}

			try {
				await bucket.file(storagePath).save(fileBuffer, {
					metadata: {
						contentType,
						metadata: {
							firebaseStorageDownloadTokens: downloadToken,
							originalName
						}
					}
				})
			} catch (uploadError) {
				console.error('Failed to upload manuscript to storage:', uploadError)
				throw new ApiError(500, 'Failed to upload manuscript. Please try again.')
			}

			newFileDescriptor = { storagePath, bucketName }

			updatePayload.file = {
				name: storageName,
				originalName,
				size: fileEntry.size,
				contentType,
				storagePath,
				storageBucket: bucketName,
				downloadToken
			}
			updatePayload.fileUploadedAt = Timestamp.now()
		}

		try {
			await paperRef.set(updatePayload, { merge: true })
		} catch (commitError) {
			if (newFileDescriptor) {
				try {
					const app = getFirebaseAdminApp()
					await getStorage(app)
						.bucket(newFileDescriptor.bucketName)
						.file(newFileDescriptor.storagePath)
						.delete({ ignoreNotFound: true })
				} catch (cleanupError) {
					console.error('Failed to clean up uploaded manuscript after commit failure:', cleanupError)
				}
			}
			throw commitError
		}

		if (newFileDescriptor && previousStoragePath && previousStoragePath !== newFileDescriptor.storagePath) {
			try {
				const app = getFirebaseAdminApp()
				const storage = getStorage(app)
				const cleanupBucket = previousBucketName
					? storage.bucket(previousBucketName)
					: newFileDescriptor.bucketName
					? storage.bucket(newFileDescriptor.bucketName)
					: storage.bucket()
				await cleanupBucket.file(previousStoragePath).delete({ ignoreNotFound: true })
			} catch (cleanupError) {
				console.error('Failed to remove previous manuscript from storage:', cleanupError)
			}
		}

		return NextResponse.json({ success: true })
	} catch (error) {
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid paper update payload.' }, { status: 400 })
		}

		return handleApiRouteError(error, 'Failed to update paper:')
	}
}

function pickRandomSample<T>(items: T[], count: number): T[] {
	const buffer = [...items]
	for (let index = buffer.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1))
		;[buffer[index], buffer[swapIndex]] = [buffer[swapIndex], buffer[index]]
	}
	return buffer.slice(0, count)
}
