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

export const conferenceSchema = z.object({
	name: z.string().min(3, { message: 'Conference name must be at least 3 characters long' }),
	description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
	startDate: z.date({ message: 'A start date is required.' }),
	endDate: z.date({ message: 'An end date is required.' })
})

export type SignupInput = z.infer<typeof signupSchema>

export type LoginInput = z.infer<typeof loginSchema>

export const userSchema = signupSchema.omit({
	password: true,
	confirmPassword: true
})

export type User = z.infer<typeof userSchema>

export type UserWithId = User & { uid: string }

export type Conference = z.infer<typeof conferenceSchema> & { id: string }

export type ConferenceInput = z.infer<typeof conferenceSchema>
