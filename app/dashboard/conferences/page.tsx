'use client'

import { collection, orderBy, query } from 'firebase/firestore'
import { useCollection } from 'react-firebase-hooks/firestore'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { type Conference } from '@/lib/schemas'

export default function ConferencesPage() {
	const [conferencesSnapshot, loading, error] = useCollection(
		query(collection(db, 'conferences'), orderBy('startDate', 'desc'))
	)

	if (loading) {
		return <p>Loading conferences...</p>
	}

	if (error) {
		return <p>Error: {error.message}</p>
	}

	const conferences = conferencesSnapshot?.docs.map((doc) => {
		const data = doc.data()
		return {
			id: doc.id,
			...data,
			startDate: data.startDate.toDate(),
			endDate: data.endDate.toDate()
		} as Conference
	})

	return (
		<>
			<h1>Conferences</h1>

			{conferences && conferences.length > 0 ? (
				conferences.map((conf) => (
					<Card key={conf.id}>
						<CardHeader>
							<CardTitle>{conf.name}</CardTitle>
							<CardDescription></CardDescription>
						</CardHeader>
						<CardContent>
							<div>
								<span>Description:</span> <span>{conf.description}</span>
							</div>
							<div>
								<span>Period:</span>{' '}
								<span>
									{conf.startDate.toLocaleDateString()} - {conf.endDate.toLocaleDateString()}
								</span>
							</div>
						</CardContent>
					</Card>
				))
			) : (
				<p>No conferences have been created yet.</p>
			)}
		</>
	)
}
