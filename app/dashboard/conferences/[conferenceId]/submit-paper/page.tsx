'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function SubmitPaperPage() {
	const params = useParams<{ conferenceId: string }>()
	const conferenceId = params?.conferenceId

	if (!conferenceId) {
		return <p>Invalid conference identifier.</p>
	}

	return (
		<>
			<h1>Submit paper</h1>

			<Card>
				<CardHeader>
					<CardTitle>Paper submission</CardTitle>
					<CardDescription>Provide submission details and upload your manuscript.</CardDescription>
				</CardHeader>
				<CardContent></CardContent>
				<CardFooter>
					<Button
						variant='outline'
						asChild
					>
						<Link href={`/dashboard/conferences/${conferenceId}`}>Back to conference</Link>
					</Button>
				</CardFooter>
			</Card>
		</>
	)
}
