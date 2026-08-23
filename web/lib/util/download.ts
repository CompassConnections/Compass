import {Directory, Encoding, Filesystem} from '@capacitor/filesystem'
import {Share} from '@capacitor/share'
import {debug} from 'common/logger'

import {isAndroidApp, isIosApp} from './webview'

/**
 * Save a text file the user asked for, on whichever shell we're running in.
 *
 * Three paths, because "download" is not one thing:
 * - **Android app**: the System WebView drops `<a download>` and blob URLs on the floor, so
 *   `MainActivity`'s `AndroidBridge.downloadFile` writes to the Downloads collection instead.
 * - **iOS app**: WKWebView has no Downloads folder to write to and Capacitor doesn't wire up
 *   `WKDownloadDelegate`, so write the file into the app's own Documents directory and hand it to
 *   the share sheet — which is how iOS expects a file to leave an app (Files, AirDrop, Mail, ...).
 * - **Browser**: the ordinary blob URL + synthetic click.
 */
export async function downloadTextFile(filename: string, content: string, mimeType: string) {
  if (isAndroidApp() && window.AndroidBridge?.downloadFile) {
    window.AndroidBridge.downloadFile(filename, content)
    return
  }

  if (isIosApp()) {
    const {uri} = await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
    })
    debug('Wrote export to', uri)
    await Share.share({title: filename, url: uri})
    return
  }

  const blob = new Blob([content], {type: mimeType})
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
