import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import 'dotenv/config'
import { Pool } from 'pg'

const connectionString = process.env.DATABASE_URL!
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
	console.log('Seeding database...')
	console.log('DATABASE_URL:', connectionString ? 'Loaded' : 'Not loaded')

	// Hash password
	const hashedPassword = await bcrypt.hash('password123', 10)

	// Create Users
	const organizer = await prisma.user.upsert({
		where: { email: 'organizer@example.com' },
		update: {},
		create: {
			email: 'organizer@example.com',
			name: 'Alice Organizer',
			password: hashedPassword,
			role: 'organizer'
		}
	})

	const reviewer1 = await prisma.user.upsert({
		where: { email: 'reviewer1@example.com' },
		update: {},
		create: {
			email: 'reviewer1@example.com',
			name: 'Bob Reviewer',
			password: hashedPassword,
			role: 'reviewer'
		}
	})

	const reviewer2 = await prisma.user.upsert({
		where: { email: 'reviewer2@example.com' },
		update: {},
		create: {
			email: 'reviewer2@example.com',
			name: 'Charlie Reviewer',
			password: hashedPassword,
			role: 'reviewer'
		}
	})

	const author = await prisma.user.upsert({
		where: { email: 'author@example.com' },
		update: {},
		create: {
			email: 'author@example.com',
			name: 'David Author',
			password: hashedPassword,
			role: 'author'
		}
	})

	console.log(`Created users: ${organizer.name}, ${reviewer1.name}, ${reviewer2.name}, ${author.name}`)
	console.log('Users created.')

	// Create Conference
	const conference = await prisma.conference.create({
		data: {
			name: 'Tech Future 2025',
			description: 'A conference about the future of technology and AI.',
			location: 'San Francisco, CA',
			startDate: new Date('2025-06-10T09:00:00Z'),
			endDate: new Date('2025-06-12T17:00:00Z'),
			organizerId: organizer.id
		}
	})

	console.log(`Conference "${conference.name}" created.`)

	// Create Paper
	const paper = await prisma.paper.create({
		data: {
			title: 'The Impact of Generative AI on Coding',
			status: 'submitted',
			authorId: author.id,
			conferenceId: conference.id,
			fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' // Mock PDF URL
		}
	})

	console.log(`Paper "${paper.title}" created.`)

	// Assign Reviewer (Create Review)
	// Check if already exists to avoid unique constraint violation if re-running without clean
	const existingReview = await prisma.review.findUnique({
		where: {
			paperId_reviewerId: {
				paperId: paper.id,
				reviewerId: reviewer1.id
			}
		}
	})

	if (!existingReview) {
		await prisma.review.create({
			data: {
				paperId: paper.id,
				reviewerId: reviewer1.id,
				status: 'pending'
			}
		})
		console.log('Review assigned.')
	} else {
		console.log('Review assignment already exists.')
	}

	console.log('Seeding finished.')
}

main().catch((e) => {
	console.error(e)
	process.exit(1)
})
