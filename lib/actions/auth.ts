'use server'

import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z
	.object({
		name: z.string().min(1),
		username: z
			.string()
			.min(3)
			.regex(/^[a-zA-Z0-9_]+$/),
		password: z.string().min(8),
		confirmPassword: z.string(),
		role: z.enum(['organizer', 'author', 'reviewer']).optional()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: 'Passwords do not match',
		path: ['confirmPassword']
	})

type RegisterInput = z.infer<typeof registerSchema>

export async function registerUser(data: RegisterInput) {
	const validation = registerSchema.safeParse(data)

	if (!validation.success) {
		return { error: 'Invalid data' }
	}

	const { username, password, name, role } = validation.data

	const existingUser = await prisma.user.findUnique({
		where: { username }
	})

	if (existingUser) {
		return { error: 'Username already taken' }
	}

	const hashedPassword = await bcrypt.hash(password, 10)

	try {
		await prisma.user.create({
			data: {
				username,
				name,
				password: hashedPassword,
				role: role || 'author'
			}
		})
		return { success: true }
	} catch (error) {
		console.error('Registration error:', error)
		return { error: 'Failed to create user' }
	}
}
