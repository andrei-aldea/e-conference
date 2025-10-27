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
	location: z.string().min(1, 'Location is required.'),
	description: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
	startDate: z.date({ message: 'A start date is required.' }),
	endDate: z.date({ message: 'An end date is required.' })
})

export const paperFormSchema = z.object({
	title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
	conferenceId: z.string().min(1, { message: 'Please select a conference' })
})

export const reviewerDecisionSchema = z.enum(['pending', 'accepted', 'declined'])

export const paperSchema = paperFormSchema.extend({
	authorId: z.string().min(1, { message: 'Author is required.' }),
	reviewers: z.array(z.string()),
	reviewerStatuses: z.record(z.string(), reviewerDecisionSchema).optional()
})

export const reviewerStatusUpdateSchema = z.object({
	paperId: z.string().min(1, { message: 'Paper identifier is required.' }),
	status: reviewerDecisionSchema
})

export const paperReviewerAssignmentSchema = z.object({
	paperId: z.string().min(1, { message: 'Paper identifier is required.' }),
	reviewerIds: z.array(z.string().min(1)).min(1, { message: 'At least one reviewer is required.' })
})

export type SignupInput = z.infer<typeof signupSchema>

export type LoginInput = z.infer<typeof loginSchema>

export const userSchema = signupSchema.omit({
	password: true,
	confirmPassword: true
})

export type User = z.infer<typeof userSchema>

export type UserWithId = User & { uid: string }

export type Conference = z.infer<typeof conferenceSchema> & {
	id: string
	organizerId?: string
	papers?: string[]
}

export type ConferenceInput = z.infer<typeof conferenceSchema>

export type PaperFormInput = z.infer<typeof paperFormSchema>

export type Paper = z.infer<typeof paperSchema>

export type ReviewerDecision = z.infer<typeof reviewerDecisionSchema>
