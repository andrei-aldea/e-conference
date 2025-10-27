#!/usr/bin/env node

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
import { cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore'

const APP_NAME = 'e-conference-seed-cli'

const envPath = path.resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath, override: false })

function assertServiceAccount() {
	const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
	if (!raw) {
		throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set.')
	}

	try {
		return JSON.parse(raw)
	} catch (error) {
		throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY contains invalid JSON.', { cause: error })
	}
}

async function loadSeedData() {
	const __filename = fileURLToPath(import.meta.url)
	const __dirname = path.dirname(__filename)
	const seedPath = path.resolve(__dirname, 'seed-data.json')
	const contents = await readFile(seedPath, 'utf-8')
	return JSON.parse(contents)
}

async function ensureAuthUser(auth, user) {
	try {
		const existing = await auth.getUserByEmail(user.email)
		await auth.updateUser(existing.uid, {
			displayName: user.name,
			password: user.password
		})
		return existing.uid
	} catch (error) {
		if (error.code !== 'auth/user-not-found') {
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

async function clearCollection(firestore, collectionPath) {
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

async function purgeExistingData(auth, firestore) {
	console.log('Clearing existing Firestore documents...')
	await Promise.all([
		clearCollection(firestore, 'submissions'),
		clearCollection(firestore, 'conferences'),
		clearCollection(firestore, 'users')
	])

	console.log('Deleting existing authentication users (excluding service accounts)...')
	let nextPageToken
	do {
		const listResult = await auth.listUsers(1000, nextPageToken)
		const userIds = listResult.users.map((userRecord) => userRecord.uid)
		if (userIds.length > 0) {
			await auth.deleteUsers(userIds)
		}
		nextPageToken = listResult.pageToken
	} while (nextPageToken)
}

async function seedUsers(auth, firestore, entries, role, extraFieldsResolver) {
	const idsByEmail = new Map()
	for (const entry of entries) {
		const uid = await ensureAuthUser(auth, entry)
		idsByEmail.set(entry.email, uid)
		const extra = extraFieldsResolver ? extraFieldsResolver(entry) : {}
		await firestore
			.collection('users')
			.doc(uid)
			.set(
				{
					name: entry.name,
					email: entry.email,
					role,
					...extra
				},
				{ merge: true }
			)
	}
	return idsByEmail
}

async function seedConferences(firestore, conferences, organizerEmailToId) {
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
					startDate: Timestamp.fromDate(new Date(conf.startDate)),
					endDate: Timestamp.fromDate(new Date(conf.endDate)),
					organizerId,
					papers: []
				},
				{ merge: true }
			)
	}
}

async function seedSubmissions(firestore, submissions, emailToIdMaps) {
	for (const submission of submissions) {
		const authorId = emailToIdMaps.author.get(submission.authorEmail)
		if (!authorId) {
			throw new Error(`Author not found for submission ${submission.id}`)
		}

		const reviewerIds = submission.reviewerEmails.map((email) => {
			const reviewerId = emailToIdMaps.reviewer.get(email)
			if (!reviewerId) {
				throw new Error(`Reviewer ${email} not found for submission ${submission.id}`)
			}
			return reviewerId
		})

		const conferenceRef = firestore.collection('conferences').doc(submission.conferenceId)
		const conferenceSnapshot = await conferenceRef.get()
		if (!conferenceSnapshot.exists) {
			throw new Error(`Conference ${submission.conferenceId} not found for submission ${submission.id}`)
		}

		await firestore
			.collection('submissions')
			.doc(submission.id)
			.set(
				{
					title: submission.title,
					authorId,
					conferenceId: submission.conferenceId,
					reviewers: reviewerIds,
					createdAt: Timestamp.fromDate(new Date(submission.createdAt))
				},
				{ merge: true }
			)

		await conferenceRef.set({ papers: FieldValue.arrayUnion(submission.id) }, { merge: true })

		for (const reviewerId of reviewerIds) {
			await firestore
				.collection('users')
				.doc(reviewerId)
				.set({ assignedPapers: FieldValue.arrayUnion(submission.id) }, { merge: true })
		}

		await firestore
			.collection('users')
			.doc(authorId)
			.set({ submissions: FieldValue.arrayUnion(submission.id) }, { merge: true })
	}
}

async function main() {
	const serviceAccount = assertServiceAccount()
	const app = getApps().find((existing) => existing.name === APP_NAME)
		? getApp(APP_NAME)
		: initializeApp({ credential: cert(serviceAccount) }, APP_NAME)

	const auth = getAuth(app)
	const firestore = getFirestore(app)

	const seed = await loadSeedData()

	await purgeExistingData(auth, firestore)

	console.log('Seeding organizers, reviewers, and authors...')
	const organizerMap = await seedUsers(auth, firestore, seed.organizers, 'organizer', (entry) => ({
		bio: entry.bio ?? ''
	}))
	const reviewerMap = await seedUsers(auth, firestore, seed.reviewers, 'reviewer', (entry) => ({
		expertise: entry.expertise ?? []
	}))
	const authorMap = await seedUsers(auth, firestore, seed.authors, 'author')

	console.log('Seeding conferences...')
	await seedConferences(firestore, seed.conferences, organizerMap)

	console.log('Seeding submissions...')
	await seedSubmissions(firestore, seed.submissions, {
		author: authorMap,
		reviewer: reviewerMap
	})

	console.log('Seed data written successfully.')
}

main()
	.then(() => {
		process.exit(0)
	})
	.catch((error) => {
		console.error('Failed to seed data:', error)
		process.exit(1)
	})
