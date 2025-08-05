'use client';

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
      setImage((prev: any) => [...prev, url]);
    } else {
      setImage(url);
    }
  }
}
