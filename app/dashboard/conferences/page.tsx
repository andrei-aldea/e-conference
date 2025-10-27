'use client'

import { collection, deleteDoc, doc, orderBy, query } from 'firebase/firestore'
import { Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCollection } from 'react-firebase-hooks/firestore'
import { toast } from 'sonner'

import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { db } from '@/lib/firebase'
import { type Conference } from '@/lib/schemas'

export default function ConferencesPage() {
	const { user } = useAuth()
	const [conferencesSnapshot, loading, error] = useCollection(
		query(collection(db, 'conferences'), orderBy('startDate', 'desc'))
	)

	function handleDelete(id: string) {
		toast.error('Are you sure you want to delete this conference?', {
			action: {
				label: 'Delete',
				onClick: async () => {
					try {
						await deleteDoc(doc(db, 'conferences', id))
						toast.success('Conference deleted successfully!')
					} catch (e) {
						console.error('Error deleting document: ', e)
						toast.error('There was an error deleting the conference.')
					}
				}
			}
		})
	}

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
							<CardDescription>
								{conf.location} ({conf.startDate.toLocaleDateString()} - {conf.endDate.toLocaleDateString()})
							</CardDescription>
							{user?.role === 'organizer' && (
								<CardAction>
									<Button
										variant='destructive'
										size='icon'
										onClick={() => handleDelete(conf.id)}
									>
										<Trash2 className='h-4 w-4' />
									</Button>
								</CardAction>
							)}
						</CardHeader>
						<CardContent>{conf.description}</CardContent>
						<CardFooter className='justify-end pt-0'>
							<Button
								variant='outline'
								asChild
							>
								<Link href={`/dashboard/conferences/${conf.id}`}>View details</Link>
							</Button>
						</CardFooter>
					</Card>
				))
			) : (
				<p>No conferences have been created yet.</p>
			)}
		</>
	)
}
