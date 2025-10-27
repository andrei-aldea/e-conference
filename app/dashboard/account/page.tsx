'use client'

import { useAuth } from '@/components/auth-provider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AccountPage() {
	const { user } = useAuth()

	if (!user) {
		return <div>Loading account details...</div>
	}

	return (
		<>
			<h1>Account</h1>
			<Card>
				<CardHeader>
					<CardTitle>My Account</CardTitle>
					<CardDescription>View your account details below.</CardDescription>
				</CardHeader>
				<CardContent className='space-y-4'>
					<div className='space-y-2'>
						<Label htmlFor='name'>Full Name</Label>
						<Input
							id='name'
							value={user.name}
							readOnly
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='email'>Email Address</Label>
						<Input
							id='email'
							type='email'
							value={user.email}
							readOnly
						/>
					</div>
					<div className='space-y-2'>
						<Label htmlFor='role'>Role</Label>
						<Input
							id='role'
							value={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
							readOnly
						/>
					</div>
				</CardContent>
			</Card>
		</>
	)
}
