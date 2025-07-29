export interface ProfileData {
  id: string;
  name: string;
  image: string;
  profile: {
    location: string;
    gender: string;
    personalityType: string;
    conflictStyle: string;
    description: string;
    contactInfo: string;
    intellectualInterests: { interest?: { name?: string } }[];
    causeAreas: { causeArea?: { name?: string } }[];
    desiredConnections: { connection?: { name?: string } }[];
    promptAnswers: { prompt?: string; answer?: string }[];
  };
}