'use client'

import { type LoginInput, type SignupInput, type User, userSchema } from '@/lib/schemas'
import Cookies from 'js-cookie'
import { useRouter } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'

type AuthContextType = {
	user: User | null
	login: (data: LoginInput) => Promise<void>
	signup: (data: SignupInput) => Promise<void>
	logout: () => void
	isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<User | null>(null)
	const [isLoading, setIsLoading] = useState(true)
	const router = useRouter()

	const logout = React.useCallback(() => {
		Cookies.remove('user')
		setUser(null)
		router.push('/login')
	}, [router])

	useEffect(() => {
		function loadUserFromCookies() {
			const cookieUser = Cookies.get('user')
			if (cookieUser) {
				try {
					const parsedUser = userSchema.parse(JSON.parse(cookieUser))
					setUser(parsedUser)
				} catch (error) {
					console.error('Failed to parse user from cookie:', error)
					// If parsing fails, the cookie is invalid, so we log out.
					logout()
				}
			}
			setIsLoading(false)
		}
		loadUserFromCookies()
	}, [logout])

	const login = async (data: LoginInput) => {
		// Mock API call
		await new Promise((resolve) => setTimeout(resolve, 1000))
		const mockUser: User = {
			name: 'Test User', // This would come from your API in a real app
			email: data.email,
			role: 'author' // Default role for login for now
		}
		Cookies.set('user', JSON.stringify(mockUser), { expires: 7 }) // Mock cookie
		setUser(mockUser)
		router.push('/dashboard')
	}

	const signup = async (data: SignupInput) => {
		// Mock API call
		await new Promise((resolve) => setTimeout(resolve, 1000))
		const newUser: User = { name: data.name, email: data.email, role: data.role }
		Cookies.set('user', JSON.stringify(newUser), { expires: 7 }) // Mock cookie
		setUser(newUser)
		router.push('/dashboard')
	}

	// While loading, we can render a spinner or null to prevent content flashing.
	if (isLoading) {
		return null // Or a loading spinner component
	}

	return <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
