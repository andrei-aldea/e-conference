import { prisma } from '@/lib/db'
import { authenticateRequest } from '@/lib/server/auth'
import { handleApiRouteError } from '@/lib/server/error-response'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id
		await authenticateRequest() // Ensure user is logged in

		const conference = await prisma.conference.findUnique({
			where: { id }
		})

		if (!conference) {
			return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
		}

		return NextResponse.json(conference)
	} catch (error) {
		return handleApiRouteError(error, 'Failed to fetch conference:')
	}
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const id = (await params).id
		const { prisma, uid } = await authenticateRequest({ allowedRoles: ['organizer'] })

		const conference = await prisma.conference.findUnique({ where: { id } })
		if (!conference) {
			return NextResponse.json({ error: 'Conference not found' }, { status: 404 })
		}

		if (conference.organizerId !== uid) {
			return NextResponse.json({ error: 'You do not have permission to edit this conference.' }, { status: 403 })
		}

		const json = await request.json()
		// Basic validation or use Zod if imported
		const { name, location, description, startDate, endDate } = json

		const updated = await prisma.conference.update({
			where: { id },
			data: {
				name,
				location,
				description,
				startDate: startDate ? new Date(startDate) : undefined,
				endDate: endDate ? new Date(endDate) : undefined
			}
		})

		return NextResponse.json(updated)
	} catch (error) {
		return handleApiRouteError(error, 'Failed to update conference:')
	}
}
