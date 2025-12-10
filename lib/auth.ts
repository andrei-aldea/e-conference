import { authConfig } from '@/lib/auth.config'
import { prisma } from '@/lib/db'
import { PrismaAdapter } from '@auth/prisma-adapter'
import bcrypt from 'bcryptjs'
import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'

export const { handlers, auth, signIn, signOut } = NextAuth({
	...authConfig,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	adapter: PrismaAdapter(prisma) as any,
	providers: [
		Credentials({
			credentials: {
				username: { label: 'Username', type: 'text' },
				password: { label: 'Password', type: 'password' }
			},
			authorize: async (credentials) => {
				if (!credentials?.username || !credentials?.password) return null

				const user = await prisma.user.findUnique({
					where: { username: credentials.username as string }
				})

				if (!user || !user.password) return null

				const isValid = await bcrypt.compare(credentials.password as string, user.password)

				if (!isValid) return null

				return {
					...user,
					role: user.role as 'organizer' | 'author' | 'reviewer'
				}
			}
		})
	]
})
