'use client'

import { FirebaseError } from 'firebase/app'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import React, { createContext, useContext, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { auth, db } from '@/lib/firebase/client'
import { type LoginInput, type SignupInput, type User, userSchema, type UserWithId } from '@/lib/validation/schemas'

type AuthContextType = {
	user: UserWithId | null
	updateUser: (data: Partial<User>) => void
	login: (data: LoginInput) => Promise<void>
	signup: (data: SignupInput) => Promise<void>
	logout: () => void
	isLoading: boolean
}

const AuthContext = createContext<AuthContextType | null>(null)

const PUBLIC_PATHS: ReadonlyArray<string> = ['/', '/login', '/signup']

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = useState<UserWithId | null>(null) // Our custom user object
	const [isLoading, setIsLoading] = useState(true) // Combined loading state
	const router = useRouter()
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const redirectParam = searchParams?.get('redirect') ?? null

	const logout = React.useCallback(async () => {
		await signOut(auth)
		// The onIdTokenChanged listener will handle clearing the cookie,
		// but we also push to /login for an immediate redirect.
		router.push('/login')
	}, [router])

	useEffect(() => {
		const unsubscribe = auth.onIdTokenChanged(async (firebaseUser) => {
			if (firebaseUser) {
				const token = await firebaseUser.getIdToken()
				// Set the cookie on the server.
				const res = await fetch('/api/auth', {
					method: 'POST',
					headers: { Authorization: `Bearer ${token}` }
				})

				if (res.ok) {
					// Fetch custom user data from Firestore
					const userDocRef = doc(db, 'users', firebaseUser.uid)
					const userDoc = await getDoc(userDocRef)

					// Redirect only after the session cookie is set and user data is fetched
					router.push(redirectParam || '/dashboard')

					if (userDoc.exists()) {
						setUser({ uid: firebaseUser.uid, ...userSchema.parse(userDoc.data()) })
					}
				}
			} else {
				setUser(null)
				// Clear the server-side session cookie
				if (!PUBLIC_PATHS.includes(pathname)) {
					router.push('/login')
				}
				// Clear the server-side session cookie. The router push is now primarily
				// handled in the logout function for explicit logouts.
				await fetch('/api/auth', { method: 'DELETE' })
			}
			setIsLoading(false)
		})

		return () => unsubscribe()
	}, [router, redirectParam, pathname])

	const login = async (data: LoginInput) => {
		try {
			const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password)
			if (userCredential.user) {
				// The onIdTokenChanged listener will handle setting the cookie and user state.
				// We can now redirect.
				toast.success('Login successful!')
			}
		} catch (error) {
			if (error instanceof FirebaseError) {
				toast.error(`Login failed: ${error.message}`)
			} else {
				toast.error('An unknown error occurred during login.')
			}
			throw error // Re-throw to be caught by the form's finally block
		}
	}

	const signup = async (data: SignupInput) => {
		try {
			const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password)
			const { uid } = userCredential.user

			const newUser: User = {
				name: data.name,
				email: data.email,
				role: data.role
			}
			await setDoc(doc(db, 'users', uid), newUser)

			// The onIdTokenChanged listener will handle setting the cookie and user state.
			// We can now redirect.
			toast.success('Signup successful!')
		} catch (error) {
			if (error instanceof FirebaseError) {
				toast.error(`Signup failed: ${error.message}`)
			} else {
				toast.error('An unknown error occurred during signup.')
			}
			throw error
		}
	}

	const updateUser = (data: Partial<User>) => {
		if (user) {
			setUser({ ...user, ...data })
		}
	}

	// While loading, we can render a spinner or null to prevent content flashing.
	if (isLoading) {
		return null // Or a loading spinner component
	}

	return (
		<AuthContext.Provider value={{ user, login, signup, logout, isLoading, updateUser }}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const context = useContext(AuthContext)
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider')
	}
	return context
}
