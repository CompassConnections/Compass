export interface MatchPrivateUser {
  email: string
  notificationPreferences: any
}

export interface MatchUser {
  name: string
  username: string
}

export interface MatchesType {
  description: {
    filters: any; // You might want to replace 'any' with a more specific type
    location: any; // You might want to replace 'any' with a more specific type
  };
  matches: any[]; // You might want to replace 'any' with a more specific type
  id: string
}

export interface MatchesByUserType {
  [key: string]: {
    user: any;
    privateUser: any;
    matches: MatchesType[];
  }
}