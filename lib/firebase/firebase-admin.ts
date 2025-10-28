import { credential } from 'firebase-admin'
import { type App, type AppOptions, getApp, getApps, initializeApp } from 'firebase-admin/app'

const serviceKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)

const appName = 'e-Conference-nextjs'

let app: App

if (getApps().some((existingApp) => existingApp.name === appName)) {
	app = getApp(appName)
} else {
	const storageBucket = process.env.FIREBASE_STORAGE_BUCKET ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
	const options: AppOptions = {
		credential: credential.cert(serviceKey)
	}

	if (storageBucket) {
		options.storageBucket = storageBucket
	}

	app = initializeApp(options, appName)
}

export function getFirebaseAdminApp() {
	return app
}
