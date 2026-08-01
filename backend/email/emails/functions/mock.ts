import {ProfileRow} from 'common/profiles/profile'
import type {User} from 'common/user'

// for email template testing

// A subset of Profile with only essential fields for testing
export type PartialProfile = Pick<
  ProfileRow,
  | 'id'
  | 'user_id'
  | 'created_time'
  | 'last_modification_time'
  | 'disabled'
  | 'looking_for_matches'
  | 'comments_enabled'
  | 'visibility'
> &
  Partial<ProfileRow>

const avatarUrl =
  'https://firebasestorage.googleapis.com/v0/b/compass-130ba.firebasestorage.app/o/user-images%2FMartin%2Flove-images%2FeD09lRtuRF.jpg?alt=media&token=db41b5f2-b1c0-4df9-aa9c-11d44c970947'
export const mockUser: User = {
  createdTime: 0,
  avatarUrl: avatarUrl,
  id: '0k1suGSJKVUnHbCPEhHNpgZPkUP2',
  username: 'Martin',
  name: 'Martin',
}

export const jamesUser: User = {
  createdTime: 0,
  avatarUrl: avatarUrl,
  id: '5LZ4LgYuySdL1huCWe7bti02ghx2',
  username: 'James',
  name: 'James',
}

export const jamesProfile: PartialProfile = {
  id: 2,
  user_id: '5LZ4LgYuySdL1huCWe7bti02ghx2',
  created_time: '2023-10-21T21:18:26.691211+00:00',
  last_modification_time: '2024-05-17T02:11:48.83+00:00',
  disabled: false,
  looking_for_matches: true,
  comments_enabled: true,
  visibility: 'public',
  city: 'San Francisco',
  gender: 'male',
  age: 32,
}
