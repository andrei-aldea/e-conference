import { z } from 'zod'

export const signupSchema = z
	.object({
		name: z.string().min(1, { message: 'Full name is required' }),
		email: z.string().email({ message: 'Please enter a valid email' }),
		role: z.enum(['organizer', 'author', 'reviewer'], { message: 'Please select a role' }),
		password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
		confirmPassword: z.string()
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords don't match",
		path: ['confirmPassword']
	})

export const loginSchema = z.object({
	email: z.string().email({ message: 'Please enter a valid email' }),
	password: z.string().min(1, { message: 'Password is required' })
})

export type SignupInput = z.infer<typeof signupSchema>

export type LoginInput = z.infer<typeof loginSchema>

export type User = z.infer<typeof userSchema>

export const userSchema = signupSchema.omit({
	password: true,
	confirmPassword: true
})
