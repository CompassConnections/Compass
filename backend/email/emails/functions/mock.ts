import {ProfileRow} from 'common/profiles/profile'
import type {User} from 'common/user'

// for email template testing

// A subset of Profile with only essential fields for testing
export type PartialProfile = Pick<ProfileRow, 
  'id' | 'user_id' | 'created_time' | 'last_modification_time' |
  'disabled' | 'looking_for_matches' | 'messaging_status' | 
  'comments_enabled' | 'visibility'
> & Partial<ProfileRow>

export const mockUser: User = {
  createdTime: 0,
  bio: 'the futa in futarchy',
  website: 'sincl.ai',
  avatarUrl:
    'https://firebasestorage.googleapis.com/v0/b/mantic-markets.appspot.com/o/user-images%2FSinclair%2FbqSXdzkn1z.JPG?alt=media&token=7779230a-9f5d-42b5-839f-fbdfef31a3ac',
  idVerified: true,
  discordHandle: 'sinclaether#5570',
  twitterHandle: 'singularitttt',
  verifiedPhone: true,
  // sweepstakesVerified: true,
  id: '0k1suGSJKVUnHbCPEhHNpgZPkUP2',
  username: 'Sinclair',
  name: 'Sinclair',
  // isAdmin: true,
  // isTrustworthy: false,
  link: {
    site: 'sincl.ai',
    x: 'singularitttt',
    discord: 'sinclaether#5570',
  },
}

export const sinclairProfile: PartialProfile = {
  // Required fields
  id: 55,
  user_id: '0k1suGSJKVUnHbCPEhHNpgZPkUP2',
  created_time: '2023-10-27T00:41:59.851776+00:00',
  last_modification_time: '2024-05-17T02:11:48.83+00:00',
  disabled: false,
  looking_for_matches: true,
  messaging_status: 'open',
  comments_enabled: true,
  visibility: 'public',
  
  // Optional commonly used fields for testing
  city: 'San Francisco',
  gender: 'trans-female',
  age: 25,
}

export const jamesUser: User = {
  createdTime: 0,
  bio: 'Manifold cofounder! We got the AMM (What!?). We got the order book (What!?). We got the combination AMM and order book!',
  website: 'https://calendly.com/jamesgrugett/manifold',
  avatarUrl:
    'https://firebasestorage.googleapis.com/v0/b/mantic-markets.appspot.com/o/user-images%2FJamesGrugett%2FefVzXKc9iz.png?alt=media&token=5c205402-04d5-4e64-be65-9d8b4836eb03',
  idVerified: true,
  // fromManifold: true,
  discordHandle: '',
  twitterHandle: 'jahooma',
  verifiedPhone: true,
  // sweepstakesVerified: true,
  id: '5LZ4LgYuySdL1huCWe7bti02ghx2',
  username: 'JamesGrugett',
  name: 'James',
  link: {
    x: 'jahooma',
    discord: '',
  },
}

export const jamesProfile: PartialProfile = {
  // Required fields
  id: 2,
  user_id: '5LZ4LgYuySdL1huCWe7bti02ghx2',
  created_time: '2023-10-21T21:18:26.691211+00:00',
  last_modification_time: '2024-05-17T02:11:48.83+00:00',
  disabled: false,
  looking_for_matches: true,
  messaging_status: 'open',
  comments_enabled: true,
  visibility: 'public',
  
  // Optional commonly used fields for testing
  city: 'San Francisco',
  gender: 'male',
  age: 32,
}
