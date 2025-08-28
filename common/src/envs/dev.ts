import { EnvConfig, PROD_CONFIG } from './prod'

export const DEV_CONFIG: EnvConfig = {
  ...PROD_CONFIG,
  domain: 'compassmeet.com',
  firebaseConfig: {
    apiKey: "AIzaSyAxzhj6bZuZ1TCw9xzibGccRHXiRWq6iy0",
    authDomain: "compass-130ba.firebaseapp.com",
    projectId: "compass-130ba",
    storageBucket: "compass-130ba.firebasestorage.app",
    messagingSenderId: "253367029065",
    appId: "1:253367029065:web:b338785af99d4145095e98",
    measurementId: "G-2LSQYJQE6P",
    region: 'us-west1',
    privateBucket: 'compass-private.firebasestorage.app',
  },
  cloudRunId: 'w3txbmd3ba',
  cloudRunRegion: 'uc',
  supabaseInstanceId: 'ltzepxnhhnrnvovqblfr',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx0emVweG5oaG5ybnZvdnFibGZyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5NjczNjgsImV4cCI6MjA3MTU0MzM2OH0.pbazcrVOG7Kh_IgblRu2VAfoBe3-xheNfRzAto7xvzY',
  apiEndpoint: 'api.compassmeet.com',
  adminIds: [
    '0vaZsIJk9zLVOWY4gb61gTrRIU73', // Martin
  ],
}
