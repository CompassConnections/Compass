export interface MatchPrivateUser {
  email: string
  notificationPreferences: any
}

export interface MatchUser {
  /** Always present — this is the `user` object `get-profiles` builds. Needed to record who an alert named. */
  id: string
  name: string
  username: string
  avatarUrl?: string | null
}

export interface MatchesType {
  description: {
    filters: any // You might want to replace 'any' with a more specific type
    location: any // You might want to replace 'any' with a more specific type
  }
  matches: MatchUser[] // You might want to replace 'any' with a more specific type
  id: string
}

export interface MatchesByUserType {
  [key: string]: {
    user: any
    privateUser: any
    matches: MatchesType[]
  }
}
