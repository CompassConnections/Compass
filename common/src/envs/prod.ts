export type EnvConfig = {
  domain: string
  firebaseConfig: FirebaseConfig
  supabaseInstanceId: string
  supabaseAnonKey: string
  posthogKey: string
  apiEndpoint: string

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
  domain: 'manifold.love',
  posthogKey: 'phc_7g8JXcONJQtsVEqOcSw4h2RzEEz5W40rD2WIjHC129h',
  supabaseInstanceId: 'lltoaluoavlzrgjplire',
  supabaseAnonKey:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdG9hbHVvYXZsenJnanBsaXJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0NTE4MDksImV4cCI6MjA1NjAyNzgwOX0.du6UI3YkcwUxTrYqYficcsT9zT5PTLsUYDIk_IkzVus',
  firebaseConfig: {
    apiKey: 'AIzaSyB_62i1KZ1_gk5vIlefi96G6lJ5dB0tXOo',
    authDomain: 'polylove-57eab.firebaseapp.com',
    projectId: 'polylove',
    region: 'us-west1',
    storageBucket: 'polylove.firebasestorage.app',
    privateBucket: 'polylove-private.firebasestorage.app',
    messagingSenderId: '226356461961',
    appId: '1:226356461961:web:ff99f7f74861454e146158',
  },
  apiEndpoint: 'api.poly.love',
  cloudRunId: 'nggbo3neva',
  cloudRunRegion: 'uc',

  adminIds: [
    '0k1suGSJKVUnHbCPEhHNpgZPkUP2', // Sinclair
  ],

  faviconPath: '/favicon.ico',
}
