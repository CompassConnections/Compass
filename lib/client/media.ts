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
    intellectualInterests: { interest?: { name?: string, id?: string } }[];
    causeAreas: { causeArea?: { name?: string, id?: string } }[];
    desiredConnections: { connection?: { name?: string, id?: string } }[];
    promptAnswers: { prompt?: string; answer?: string, id?: string }[];
  };
}

export async function parseImage(img: string, setImage: any) {
  if (!img) {
    return;
  }
  if (img.startsWith('http')) {
    console.log(`img: ${img}`)
    setImage(img);
  } else {
    const imageResponse = await fetch(`/api/download?key=${img}`);
    console.log(`imageResponse: ${imageResponse}`)
    if (imageResponse.ok) {
      const imageBlob = await imageResponse.json();
      const imageUrl = imageBlob['url'];
      setImage(imageUrl);
    }
  }
}