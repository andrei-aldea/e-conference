'use server'

import { prisma } from '@/lib/db'
import { signupSchema, type SignupInput } from '@/lib/validation/schemas'
import bcrypt from 'bcryptjs'

export async function registerUser(data: SignupInput) {
	const validation = signupSchema.safeParse(data)

	if (!validation.success) {
		return { error: 'Invalid data' }
	}

	const { email, password, name, role } = validation.data

	const existingUser = await prisma.user.findUnique({
		where: { email }
	})

	if (existingUser) {
		return { error: 'User already exists' }
	}

	const hashedPassword = await bcrypt.hash(password, 10)

	try {
		// cast role to any to avoid type check against strict string literal if Prisma types are loose or strict
		await prisma.user.create({
			data: {
				email,
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
