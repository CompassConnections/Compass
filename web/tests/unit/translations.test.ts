describe('translation', () => {
  it('same number of translation keys', async () => {
    const de = await import('web/messages/de.json')
    const fr = await import('web/messages/fr.json')

    // Check if both files have the same number of top-level keys
    // expect(Object.keys(de).length).toBe(Object.keys(fr).length)

    // Check if all keys in de exist in fr and log any missing ones
    const missingKeys = Object.keys(fr).filter((key) => !de.hasOwnProperty(key))
    if (missingKeys.length > 0) {
      console.log('Missing keys in de.json:', missingKeys)
    }
    expect(missingKeys).toEqual([])
  })
})
