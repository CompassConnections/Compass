'use client';

export interface ProfileData {
  id: string;
  name: string;
  image: string;
  profile: {
    location: string;
    gender: string;
    birthYear: number;
    introversion: number;
    occupation: string;
    personalityType: string;
    conflictStyle: string;
    description: string;
    contactInfo: string;
    intellectualInterests: { interest?: { name?: string, id?: string } }[];
    coreValues: { value?: { name?: string, id?: string } }[];
    books: { value?: { name?: string, id?: string } }[];
    causeAreas: { causeArea?: { name?: string, id?: string } }[];
    desiredConnections: { connection?: { name?: string, id?: string } }[];
    promptAnswers: { prompt?: string; answer?: string, id?: string }[];
    images: string[];
  };
}

export type DropdownKey = 'interests' | 'causeAreas' | 'connections' | 'coreValues' | 'books';
export type RangeKey = 'age' | 'introversion';

// type OtherKey = 'gender' | 'searchQuery';

export interface Item {
  id: DropdownKey;
  name: string;
}