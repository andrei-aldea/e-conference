import type { NextAuthConfig } from 'next-auth'

export const authConfig = {
	providers: [],
	session: { strategy: 'jwt' },
	callbacks: {
		async jwt({ token, user }) {
			if (user) {
				token.role = user.role as 'organizer' | 'author' | 'reviewer'
				token.id = user.id
				token.username = (user as { username?: string }).username || ''
			}
			return token
		},
		async session({ session, token }) {
			if (session.user) {
				session.user.role = token.role as 'organizer' | 'author' | 'reviewer'
				session.user.id = token.id as string
				session.user.username = token.username as string
			}
			return session
		}
	}
} satisfies NextAuthConfig
