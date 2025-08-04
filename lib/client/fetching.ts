export async function fetchFeatures(setAllFeatures: any) {
  // results = []
  try {
    const res = await fetch('/api/interests');
    if (res.ok) {
      const data = await res.json();
      for (const [id, values] of Object.entries(data)) {
        setAllFeatures(id, values || []);
        // results.push({id, values});
      }
    }
  } catch (error) {
    console.error('Error fetching feature options:', error);
  }
}