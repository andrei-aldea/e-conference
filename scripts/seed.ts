#!/usr/bin/env node

import { randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import type { Bucket } from '@google-cloud/storage'
import dotenv from 'dotenv'
import type { ServiceAccount } from 'firebase-admin'
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth, type Auth } from 'firebase-admin/auth'
import { FieldValue, Timestamp, getFirestore, type Firestore } from 'firebase-admin/firestore'
import { getStorage } from 'firebase-admin/storage'

const APP_NAME = 'e-conference-seed-cli'

const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath, override: false })

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

type ReviewerStatus = 'pending' | 'accepted' | 'declined'

type SeedUser = {
	name: string
	email: string
	password: string
}

type SeedConference = {
	id: string
	name: string
	description: string
	location: string
	startDate: string
	endDate: string
	organizerEmail: string
}

type SeedPaper = {
	id: string
	title: string
	authorEmail: string
	conferenceId: string
	reviewerEmails: string[]
	reviewerStatuses?: Record<string, ReviewerStatus>
	createdAt: string
}

type SeedData = {
	organizers: SeedUser[]
	reviewers: SeedUser[]
	authors: SeedUser[]
	conferences: SeedConference[]
	papers: SeedPaper[]
}

type UserRoleSeed = 'organizer' | 'reviewer' | 'author'

type EmailToIdMaps = {
	author: Map<string, string>
	reviewer: Map<string, string>
}

type SeedManuscriptAsset = {
	buffer: Buffer
	originalName: string
	size: number
	contentType: string
}

const DEFAULT_REVIEWER_STATUS: ReviewerStatus = 'pending'
const VALID_REVIEWER_STATUSES = new Set<ReviewerStatus>(['pending', 'accepted', 'declined'])

function parseDate(input: string, context: string): Date {
	const date = new Date(input)
	if (Number.isNaN(date.getTime())) {
		throw new Error(`Invalid date "${input}" for ${context}. Expected an ISO 8601 string.`)
	}
	return date
}

function assertServiceAccount(): ServiceAccount {
	const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
	if (!raw) {
		throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.')
	}

	try {
		return JSON.parse(raw) as ServiceAccount
	} catch (error) {
		throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON.', { cause: error })
	}
}

async function loadSeedData(): Promise<SeedData> {
	const seedPath = path.resolve(__dirname, 'seed-data.json')
	const contents = await readFile(seedPath, 'utf-8')
	return JSON.parse(contents) as SeedData
}

async function loadSeedManuscriptAsset(): Promise<SeedManuscriptAsset> {
	const assetPath = path.resolve(__dirname, '../public/conference-organizer.pdf')
	try {
		const buffer = await readFile(assetPath)
		return {
			buffer,
			originalName: 'conference-organizer.pdf',
			size: buffer.byteLength,
			contentType: 'application/pdf'
		}
	} catch (error) {
		throw new Error(`Failed to load seed manuscript at ${assetPath}`, { cause: error })
	}
}

async function ensureAuthUser(auth: Auth, user: SeedUser): Promise<string> {
	try {
		const existing = await auth.getUserByEmail(user.email)
		await auth.updateUser(existing.uid, {
			displayName: user.name,
			password: user.password
		})
		return existing.uid
	} catch (error: unknown) {
		if (typeof error === 'object' && error !== null && 'code' in error && error.code !== 'auth/user-not-found') {
			throw error
		}
		const created = await auth.createUser({
			email: user.email,
			password: user.password,
			displayName: user.name
		})
		return created.uid
	}
}

async function clearCollection(firestore: Firestore, collectionPath: string): Promise<void> {
	const snapshot = await firestore.collection(collectionPath).get()
	const docs = snapshot.docs
	if (docs.length === 0) {
		return
	}
	const chunkSize = 450
	for (let index = 0; index < docs.length; index += chunkSize) {
		const batch = firestore.batch()
		for (const docRef of docs.slice(index, index + chunkSize)) {
			batch.delete(docRef.ref)
		}
		await batch.commit()
	}
}

async function purgeExistingData(auth: Auth, firestore: Firestore): Promise<void> {
	console.log('Clearing existing Firestore documents...')
	await Promise.all([
		clearCollection(firestore, 'papers'),
		clearCollection(firestore, 'conferences'),
		clearCollection(firestore, 'users')
	])

	console.log('Deleting existing authentication users (excluding service accounts)...')
	let nextPageToken: string | undefined
	do {
		const listResult = await auth.listUsers(1000, nextPageToken)
		const userIds = listResult.users.map((userRecord) => userRecord.uid)
		if (userIds.length > 0) {
			await auth.deleteUsers(userIds)
		}
		nextPageToken = listResult.pageToken
	} while (nextPageToken)
}

async function seedUsers(
	auth: Auth,
	firestore: Firestore,
	entries: SeedUser[],
	role: UserRoleSeed
): Promise<Map<string, string>> {
	const idsByEmail = new Map<string, string>()
	for (const entry of entries) {
		const uid = await ensureAuthUser(auth, entry)
		idsByEmail.set(entry.email, uid)
		await firestore.collection('users').doc(uid).set(
			{
				name: entry.name,
				email: entry.email,
				role
			},
			{ merge: true }
		)
	}
	return idsByEmail
}

async function seedConferences(
	firestore: Firestore,
	conferences: SeedConference[],
	organizerEmailToId: Map<string, string>
): Promise<void> {
	for (const conf of conferences) {
		const organizerId = organizerEmailToId.get(conf.organizerEmail)
		if (!organizerId) {
			throw new Error(`Organizer not found for conference ${conf.id}`)
		}

		await firestore
			.collection('conferences')
			.doc(conf.id)
			.set(
				{
					name: conf.name,
					description: conf.description,
					location: conf.location,
					startDate: Timestamp.fromDate(parseDate(conf.startDate, `conference ${conf.id} startDate`)),
					endDate: Timestamp.fromDate(parseDate(conf.endDate, `conference ${conf.id} endDate`)),
					organizerId,
					papers: []
				},
				{ merge: true }
			)
	}
}

async function seedPapers(
	firestore: Firestore,
	bucket: Bucket,
	papers: SeedPaper[],
	emailToIdMaps: EmailToIdMaps,
	asset: SeedManuscriptAsset
): Promise<void> {
	const bucketName = bucket.name

	if (!bucketName) {
		throw new Error('Storage bucket is not configured. Set FIREBASE_STORAGE_BUCKET to seed manuscripts.')
	}

	for (const paper of papers) {
		const authorId = emailToIdMaps.author.get(paper.authorEmail)
		if (!authorId) {
			throw new Error(`Author not found for paper ${paper.id}`)
		}

		const reviewerIds = paper.reviewerEmails.map((email) => {
			const reviewerId = emailToIdMaps.reviewer.get(email)
			if (!reviewerId) {
				throw new Error(`Reviewer ${email} not found for paper ${paper.id}`)
			}
			return reviewerId
		})

		const reviewerStatuses = reviewerIds.reduce<Record<string, ReviewerStatus>>((acc, reviewerId, index) => {
			const reviewerEmail = paper.reviewerEmails[index]
			const explicitStatus = paper.reviewerStatuses?.[reviewerEmail]
			const normalizedStatus =
				explicitStatus && VALID_REVIEWER_STATUSES.has(explicitStatus) ? explicitStatus : DEFAULT_REVIEWER_STATUS
			acc[reviewerId] = normalizedStatus
			return acc
		}, {})

		const conferenceRef = firestore.collection('conferences').doc(paper.conferenceId)
		const conferenceSnapshot = await conferenceRef.get()
		if (!conferenceSnapshot.exists) {
			throw new Error(`Conference ${paper.conferenceId} not found for paper ${paper.id}`)
		}

		const createdAt = Timestamp.fromDate(parseDate(paper.createdAt, `paper ${paper.id} createdAt`))
		const fileUploadedAt = createdAt
		const storageName = 'seed-manuscript.pdf'
		const storagePath = `papers/${paper.id}/${storageName}`
		const downloadToken = randomUUID()

		await bucket.file(storagePath).save(asset.buffer, {
			metadata: {
				contentType: asset.contentType,
				metadata: {
					firebaseStorageDownloadTokens: downloadToken,
					originalName: asset.originalName
				}
			}
		})

		await firestore
			.collection('papers')
			.doc(paper.id)
			.set(
				{
					title: paper.title,
					authorId,
					conferenceId: paper.conferenceId,
					reviewers: reviewerIds,
					reviewerStatuses,
					createdAt,
					fileUploadedAt,
					file: {
						name: storageName,
						originalName: asset.originalName,
						size: asset.size,
						contentType: asset.contentType,
						storagePath,
						storageBucket: bucketName,
						downloadToken
					}
				},
				{ merge: true }
			)

		await conferenceRef.set({ papers: FieldValue.arrayUnion(paper.id) }, { merge: true })

		for (const reviewerId of reviewerIds) {
			await firestore
				.collection('users')
				.doc(reviewerId)
				.set({ assignedPapers: FieldValue.arrayUnion(paper.id) }, { merge: true })
		}

		await firestore
			.collection('users')
			.doc(authorId)
			.set({ papers: FieldValue.arrayUnion(paper.id) }, { merge: true })
	}
}

async function main(): Promise<void> {
	const serviceAccount = assertServiceAccount()
	const existingApp = getApps().find((appInstance) => appInstance.name === APP_NAME)
	const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
	const appOptions = storageBucket
		? { credential: cert(serviceAccount), storageBucket }
		: { credential: cert(serviceAccount) }
	const app = existingApp ?? initializeApp(appOptions, APP_NAME)

	const auth = getAuth(app)
	const firestore = getFirestore(app)
	const storage = getStorage(app)
	const bucket = storage.bucket()

	const seed = await loadSeedData()
	const manuscriptAsset = await loadSeedManuscriptAsset()

	await purgeExistingData(auth, firestore)

	console.log('Seeding organizers, reviewers, and authors...')
	const organizerMap = await seedUsers(auth, firestore, seed.organizers, 'organizer')
	const reviewerMap = await seedUsers(auth, firestore, seed.reviewers, 'reviewer')
	const authorMap = await seedUsers(auth, firestore, seed.authors, 'author')

	console.log('Seeding conferences...')
	await seedConferences(firestore, seed.conferences, organizerMap)

	console.log('Seeding papers...')
	await seedPapers(
		firestore,
		bucket,
		seed.papers,
		{
			author: authorMap,
			reviewer: reviewerMap
		},
		manuscriptAsset
	)

	console.log('Seed data written successfully.')
}

main()
	.then(() => {
		process.exit(0)
	})
	.catch((error: unknown) => {
		console.error('Failed to seed data:', error)
		process.exit(1)
	})
