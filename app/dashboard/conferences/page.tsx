'use client'

import { collection, orderBy, query } from 'firebase/firestore'
import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'

import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
					<Card
						key={conf.id}
						className='mb-4'
					>
						<CardHeader>
							<CardTitle>{conf.name}</CardTitle>
							<CardDescription className='flex justify-between'>
								<span>{conf.location}</span>

								<Button variant='outline'>
									<Link href={`/dashboard/conferences/${conf.id}`}>View details</Link>
								</Button>
							</CardDescription>
						</CardHeader>
					</Card>
				))
			) : (
				<p>No conferences have been created yet.</p>
			)}
		</>
	)
}
