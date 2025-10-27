import { getAuth } from 'firebase-admin/auth'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'
import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'

import { getFirebaseAdminApp } from '@/lib/firebase-admin'
import { submissionFormSchema } from '@/lib/schemas'

function getFirestoreInstance() {
	return getFirestore(getFirebaseAdminApp())
}

function getAuthInstance() {
	return getAuth(getFirebaseAdminApp())
}

export async function GET() {
	try {
		const cookieStore = await cookies()
		const sessionCookie = cookieStore.get('session')?.value
		if (!sessionCookie) {
			return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
		}

		const auth = getAuthInstance()
		const decoded = await auth.verifySessionCookie(sessionCookie, true)
		const uid = decoded.uid

		const firestore = getFirestoreInstance()
		const userDoc = await firestore.collection('users').doc(uid).get()
		if (!userDoc.exists) {
			return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
		}

		const userData = userDoc.data()
		if (userData?.role !== 'author') {
			return NextResponse.json({ error: 'Only authors can view submissions.' }, { status: 403 })
		}

		const submissionsSnapshot = await firestore.collection('submissions').where('authorId', '==', uid).get()

		const reviewerIds = new Set<string>()
		const conferenceIds = new Set<string>()
		const submissions = submissionsSnapshot.docs.map((doc) => {
			const data = doc.data()
			for (const reviewerId of data.reviewers ?? []) {
				reviewerIds.add(reviewerId)
			}
			const conferenceId = typeof data.conferenceId === 'string' ? data.conferenceId : null
			if (conferenceId) {
				conferenceIds.add(conferenceId)
			}
			return {
				id: doc.id,
				title: data.title as string,
				reviewers: data.reviewers ?? [],
				conferenceId,
				createdAt: data.createdAt?.toDate?.().toISOString?.() ?? null
			}
		})

		let reviewerLookup: Record<string, string> = {}
		if (reviewerIds.size > 0) {
			const reviewerDocs = await firestore.getAll(
				...[...reviewerIds].map((reviewerId) => firestore.collection('users').doc(reviewerId))
			)
			reviewerLookup = reviewerDocs.reduce<Record<string, string>>((acc, snapshot) => {
				if (snapshot.exists) {
					const reviewerData = snapshot.data()
					acc[snapshot.id] = typeof reviewerData?.name === 'string' ? reviewerData.name : 'Unnamed reviewer'
				}
				return acc
			}, {})
		}

		let conferenceLookup: Record<string, string> = {}
		if (conferenceIds.size > 0) {
			const conferenceDocs = await firestore.getAll(
				...[...conferenceIds].map((confId) => firestore.collection('conferences').doc(confId))
			)
			conferenceLookup = conferenceDocs.reduce<Record<string, string>>((acc, snapshot) => {
				if (snapshot.exists) {
					const conferenceData = snapshot.data()
					acc[snapshot.id] = typeof conferenceData?.name === 'string' ? conferenceData.name : 'Conference'
				}
				return acc
			}, {})
		}

		submissions.sort((a, b) => {
			const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
			const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
			return bDate - aDate
		})

		const submissionsWithDetails = submissions.map((submission) => ({
			id: submission.id,
			title: submission.title,
			conferenceId: submission.conferenceId,
			conference: submission.conferenceId
				? {
						id: submission.conferenceId,
						name: conferenceLookup[submission.conferenceId] ?? 'Conference'
				  }
				: null,
			reviewers: submission.reviewers.map((reviewerId: string) => ({
				id: reviewerId,
				name: reviewerLookup[reviewerId] ?? 'Reviewer'
			})),
			createdAt: submission.createdAt
		}))

		return NextResponse.json({ submissions: submissionsWithDetails })
	} catch (error) {
		console.error('Failed to list submissions:', error)
		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}

export async function POST(request: NextRequest) {
	try {
		const payload = await request.json()
		const { title, conferenceId } = submissionFormSchema.parse(payload)

		const cookieStore = await cookies()
		const sessionCookie = cookieStore.get('session')?.value
		if (!sessionCookie) {
			return NextResponse.json({ error: 'Authentication required.' }, { status: 401 })
		}

		const auth = getAuthInstance()
		const decoded = await auth.verifySessionCookie(sessionCookie, true)
		const uid = decoded.uid

		const firestore = getFirestoreInstance()
		const userSnapshot = await firestore.collection('users').doc(uid).get()
		if (!userSnapshot.exists) {
			return NextResponse.json({ error: 'User profile not found.' }, { status: 404 })
		}

		const userData = userSnapshot.data()
		if (userData?.role !== 'author') {
			return NextResponse.json({ error: 'Only authors can submit papers.' }, { status: 403 })
		}

		const conferenceRef = firestore.collection('conferences').doc(conferenceId)
		const conferenceSnapshot = await conferenceRef.get()
		if (!conferenceSnapshot.exists) {
			return NextResponse.json({ error: 'Selected conference does not exist.' }, { status: 404 })
		}

		const reviewersSnapshot = await firestore.collection('users').where('role', '==', 'reviewer').get()
		const reviewerIds = reviewersSnapshot.docs.map((doc) => doc.id).filter((reviewerId) => reviewerId !== uid)

		if (reviewerIds.length < 2) {
			return NextResponse.json(
				{ error: 'Not enough reviewers available. Please contact an organizer.' },
				{ status: 503 }
			)
		}

		const assignedReviewers = pickRandomSample(reviewerIds, 2)

		const submissionRef = await firestore.collection('submissions').add({
			title,
			authorId: uid,
			reviewers: assignedReviewers,
			conferenceId,
			createdAt: Timestamp.now()
		})

		try {
			const batch = firestore.batch()
			batch.set(conferenceRef, { papers: FieldValue.arrayUnion(submissionRef.id) }, { merge: true })
			for (const reviewerId of assignedReviewers) {
				const reviewerRef = firestore.collection('users').doc(reviewerId)
				batch.set(reviewerRef, { assignedPapers: FieldValue.arrayUnion(submissionRef.id) }, { merge: true })
			}
			await batch.commit()
		} catch (commitError) {
			await submissionRef.delete()
			throw commitError
		}

		return NextResponse.json({ success: true }, { status: 201 })
	} catch (error) {
		console.error('Failed to submit paper:', error)
		if (error instanceof ZodError) {
			return NextResponse.json({ error: 'Invalid submission payload.' }, { status: 400 })
		}

		return NextResponse.json({ error: 'Internal server error. Please try again.' }, { status: 500 })
	}
}

function pickRandomSample<T>(items: T[], count: number): T[] {
	const buffer = [...items]
	for (let i = buffer.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[buffer[i], buffer[j]] = [buffer[j], buffer[i]]
	}
	return buffer.slice(0, count)
}
