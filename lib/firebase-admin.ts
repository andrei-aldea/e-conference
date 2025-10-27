import { credential } from 'firebase-admin'
import { type App, getApp, getApps, initializeApp } from 'firebase-admin/app'

const serviceKey = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string)

const appName = 'e-Conference-nextjs'

let app: App

if (getApps().some((app) => app.name === appName)) {
	app = getApp(appName)
} else {
	app = initializeApp(
		{
			credential: credential.cert(serviceKey)
		},
		appName
	)
}

export const getFirebaseAdminApp = () => {
	return app
}
