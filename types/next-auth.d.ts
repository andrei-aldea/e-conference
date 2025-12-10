import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
	interface Session {
		user: {
			role: 'organizer' | 'author' | 'reviewer'
			id: string
			username: string
		} & DefaultSession['user']
	}

	interface User {
		role: 'organizer' | 'author' | 'reviewer'
		username: string
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		role: 'organizer' | 'author' | 'reviewer'
		id: string
		username: string
	}
}
