import { EnvConfig, PROD_CONFIG } from './prod'

export const DEV_CONFIG: EnvConfig = {
  ...PROD_CONFIG,
  domain: 'dev.compassmeet.com',
  backendDomain: 'api.dev.compassmeet.com',
  supabaseInstanceId: 'zbspxezubpzxmuxciurg',
  supabasePwd: 'ZTNlifGKofSKhu8c', // For database write access (dev). A 16-character password with digits and letters.
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpic3B4ZXp1YnB6eG11eGNpdXJnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODM0MTMsImV4cCI6MjA3MzI1OTQxM30.ZkM7zlawP8Nke0T3KJrqpOQ4DzqPaXTaJXLC2WU8Y7c',
  googleApplicationCredentials: 'googleApplicationCredentials-dev.json',
  firebaseConfig: {
    apiKey: "AIzaSyBspL9glBXWbMsjmtt36dgb2yU0YGGhzKo",
    authDomain: "compass-57c3c.firebaseapp.com",
    projectId: "compass-57c3c",
    storageBucket: "compass-57c3c.firebasestorage.app",
    privateBucket: 'compass-130ba-private',
    messagingSenderId: "297460199314",
    appId: "1:297460199314:web:c45678c54285910e255b4b",
    measurementId: "G-N6LZ64EMJ2",
    region: 'us-west1',
  },
  adminIds: [
    'ULxLz04VW1V4vbnj5XLwvzCSkYd2', // Martin
  ],
}
