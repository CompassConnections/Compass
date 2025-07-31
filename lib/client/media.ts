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

export async function parseImage(img: string, setImage: any, batch = false) {
  if (!img) {
    return;
  }
  let url = img;
  if (!img.startsWith('http')) {
    const imageResponse = await fetch(`/api/download?key=${img}`);
    console.log(`imageResponse: ${imageResponse}`)
    if (imageResponse.ok) {
      const imageBlob = await imageResponse.json();
      url = imageBlob['url'];
    }
  }
  if (url) {
    if (batch) {
      setImage(prev => [...prev, url]);
    } else {
      setImage(url);
    }
  }

}