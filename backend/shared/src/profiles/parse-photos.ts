export const removePinnedUrlFromPhotoUrls = async (parsedBody: {
  pinned_url?: string
  photo_urls?: string[] | null
}) => {
  if (parsedBody.photo_urls && parsedBody.pinned_url) {
    parsedBody.photo_urls = parsedBody.photo_urls.filter(
      (url: string) => url !== parsedBody.pinned_url
    )
  }
}
