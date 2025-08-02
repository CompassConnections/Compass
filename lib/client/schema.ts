'use client';

export interface ProfileData {
  id: string;
  name: string;
  image: string;
  profile: {
    location: string;
    gender: string;
    birthYear: number;
    occupation: string;
    personalityType: string;
    conflictStyle: string;
    description: string;
    contactInfo: string;
    intellectualInterests: { interest?: { name?: string, id?: string } }[];
    causeAreas: { causeArea?: { name?: string, id?: string } }[];
    desiredConnections: { connection?: { name?: string, id?: string } }[];
    promptAnswers: { prompt?: string; answer?: string, id?: string }[];
    images: string[];
  };
}