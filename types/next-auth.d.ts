import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			/** The user's role. */
			role: 'organizer' | 'author' | 'reviewer'
			id: string
		} & DefaultSession['user']
	}

	interface User {
		role: 'organizer' | 'author' | 'reviewer'
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		role: 'organizer' | 'author' | 'reviewer'
		id: string
	}
}
