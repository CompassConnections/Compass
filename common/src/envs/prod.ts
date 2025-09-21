export type EnvConfig = {
  domain: string
  firebaseConfig: FirebaseConfig
  supabaseInstanceId: string
  supabaseAnonKey: string
  supabasePwd?: string
  posthogKey: string
  backendDomain: string
  googleApplicationCredentials: string | undefined

  // IDs for v2 cloud functions -- find these by deploying a cloud function and
  // examining the URL, https://[name]-[cloudRunId]-[cloudRunRegion].a.run.app
  cloudRunId: string
  cloudRunRegion: string

  // Access controls
  adminIds: string[]

  faviconPath: string // Should be a file in /public
}

type FirebaseConfig = {
  apiKey: string
  authDomain: string
  projectId: string
  region?: string
  storageBucket: string
  privateBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

export const PROD_CONFIG: EnvConfig = {
  posthogKey: 'phc_tFvQzHiMVdaAIgE38xqYomMN8q8SB5K45fqmkKNjfBU',
  domain: 'compassmeet.com',
  backendDomain: 'api.compassmeet.com',
  supabaseInstanceId: 'ltzepxnhhnrnvovqblfr',
  supabaseAnonKey: '',
  supabasePwd: '',
  googleApplicationCredentials: undefined,
  firebaseConfig: {
    apiKey: '',
    authDomain: "compass-130ba.firebaseapp.com",
    projectId: "compass-130ba",
    storageBucket: "compass-130ba.firebasestorage.app",
    privateBucket: 'compass-private.firebasestorage.app',
    messagingSenderId: "253367029065",
    appId: "1:253367029065:web:b338785af99d4145095e98",
    measurementId: "G-2LSQYJQE6P",
    region: 'us-west1',
  },
  cloudRunId: 'w3txbmd3ba',
  cloudRunRegion: 'uc',
  adminIds: [
    '0vaZsIJk9zLVOWY4gb61gTrRIU73', // Martin
  ],
  faviconPath: '/favicon.ico',
}

export const refreshConfig = () => {
  PROD_CONFIG.supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY || ''
  PROD_CONFIG.supabasePwd = process.env.SUPABASE_DB_PASSWORD || ''
  PROD_CONFIG.googleApplicationCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS
  PROD_CONFIG.firebaseConfig.apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''
}

refreshConfig()
