# Compass Android WebView App

This folder contains the source code for the Android application of Compass.
A hybrid mobile app built with **Next.js (TypeScript)** frontend, **Firebase backend**, and wrapped as a **Capacitor WebView** for Android. In the future it may contain native code as well.

This document describes how to:
1. Build and run the web frontend and backend locally  
2. Sync and build the Android WebView wrapper  
3. Debug, sign, and publish the APK  
4. Enable Google Sign-In and push notifications

---

## 1. Project Overview

The app is a Capacitor Android project that loads the local Next.js assests inside a WebView.

During development, it can instead load the local frontend (`http://10.0.2.2:3000`) and backend (`http://10.0.2.2:8088`).

Firebase handles authentication and push notifications.
Google Sign-In is supported natively in the WebView via the Capacitor Social Login plugin.

Project Structure

- `app/src/main/java/com/compass/app`: Contains the Java/Kotlin source code for the Android application.
- `app/src/main/res`: Contains the resources for the application, such as layouts, strings, and images.
- `app/build.gradle`: The Gradle build file for the Android application module.
- `build.gradle`: The top-level Gradle build file for the project.
- `AndroidManifest.xml`: The manifest file that describes essential information about the application.

### **Why Local Is the Default**
- **Performance:** Local assets load instantly, without network latency.
- **Reliability:** Works offline or in poor connectivity environments.
- **App Store policy compliance:** Apple and Google generally prefer that the main experience doesn’t depend on a remote site (for security, review, and performance reasons).
- **Version consistency:** The web bundle is versioned with the app, ensuring no breaking updates outside your control.

When Remote (No Local Assets) Is sometimes Used
Loading from a **remote URL** (e.g. `https://compassmeet.com`) is **less common**, but seen in a few cases:
- **Internal enterprise apps** where the WebView just wraps an existing web portal.
- **Dynamic content** or **frequent updates** where pushing a new web build every time through app stores would be too slow.
- To leverage the low latency of ISR and SSR.
However, this approach requires:
- Careful handling of **CORS**, **SSL**, and **login/session** persistence.
- Compliance with **Google Play policies** (they may reject apps that are “just a webview of a website” unless there’s meaningful native integration).

**A middle ground we use:**
- The app ships with **local assets** for core functionality.
- The app **fetches remote content or updates** (e.g., via Capacitor Live Updates, Ionic Appflow).

## 2. Prerequisites

### Required Software
| Tool           | Version | Purpose                            |
| -------------- | ------- | ---------------------------------- |
| Node.js        | 22+     | For building frontend/backend      |
| yarn           | latest  | Package manager                    |
| Java           | 21      | Required for Android Gradle plugin |
| Android Studio | latest  | For building and signing APKs      |
| Capacitor CLI  | latest  | Android bridge                     |
| OpenJDK        | 21      | JDK for Gradle                     |

### Environment Setup
```bash
sudo apt install openjdk-21-jdk
sudo update-alternatives --config java
# Select Java 21

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
java -version
javac -version
````

---

## 3. Build and Run the Web App

```
yarn install
yarn build-web
```

### Local mode

If you want the webview to load from your local web version of Compass, run the web app.

In root directory:
```bash
export NEXT_PUBLIC_LOCAL_ANDROID=1
yarn dev # or prod
```

* Runs Next.js frontend at `http://localhost:3000`
* Runs backend at `http://10.0.2.2:8088`

### Deployed mode

If you want the webview to load from the deployed web version of Compass (like at www.compassmeet.com), no web app to run.

---

## 5. Android WebView App Setup

### Install dependencies

```
cd android
./gradlew clean
```

Sync web files and native plugins with Android, for offline fallback. In root:
``` 
export NEXT_PUBLIC_LOCAL_ANDROID=1 # if running your local web Compass
yarn build-web # if you made changes to web app
npx cap sync android
```

### Load from site

During local development, open Android Studio project and run the app on an emulator or your physical device. Note that right now you can't use a physical device for the local web version (`10.0.2.2:3000 time out` )

```
npx cap open android
```

Building the Application:
1. Open Android Studio.
2. Click on "Open an existing Android Studio project".
3. Navigate to the `android` folder in this repository and select it.
4. Wait for Android Studio to index the project and download any necessary dependencies.
5. Connect your Android device via USB or set up an Android emulator.
6. Click on the "Run" button (green play button) in Android Studio to build and run the application.
7. Select your device or emulator and click "OK".
8. The application should now build and launch on your device or emulator.

---

## 6. Building the APK

### From Android Studio

- If you want to generate a signed APK for release, go to "Build" > "Generate Signed Bundle / APK..." and follow the prompts.
- Make sure to test the application thoroughly on different devices and Android versions to ensure compatibility.

### Debug build

```bash
cd android
./gradlew assembleDebug
```

Outputs:

```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Install on emulator

```bash
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Release build (signed)

1. Generate a release keystore:

   ```bash
   keytool -genkey -v -keystore release-key.keystore -alias compass \
     -keyalg RSA -keysize 2048 -validity 10000
   ```
2. Add signing config to `android/app/build.gradle`
3. Build:

   ```bash
   ./gradlew assembleRelease
   ```

---
## 9. Debugging

Client logs from the emulator on Chrome can be accessed at:  
```  
chrome://inspect/#devices  
```  
  
Backend logs can be accessed from the output of `yarn prod / dev` like in the web application.  
  
Java/Kotlin logs can be accessed via Android Studio's Logcat.  
```  
adb logcat | grep CompassApp
adb logcat | grep com.compassconnections.app
adb logcat | grep Capacitor
```

You can also add this inside `MainActivity.java`:

```java
webView.setWebChromeClient(new WebChromeClient() {
  @Override
  public boolean onConsoleMessage(ConsoleMessage consoleMessage) {
    Log.d("WebView", consoleMessage.message());
    return true;
  }
});
```

---

## 10. Deploy to Play Store

1. Sign the release APK or AAB.
2. Verify package name matches Firebase settings (`com.compassconnections.app`).
3. Upload to Google Play Console.
4. Add Privacy Policy and content rating.
5. Submit for review.

---

## 11. Common Issues

| Problem                                | Cause                                  | Fix                                                                 |
| -------------------------------------- | -------------------------------------- | ------------------------------------------------------------------- |
| `INSTALL_FAILED_UPDATE_INCOMPATIBLE`   | Old APK signed with different key      | Uninstall old app first                                             |
| `Account reauth failed [16]`           | Missing or incorrect SHA-1 in Firebase | Re-add SHA-1 of keystore                                            |
| App opens in Firefox                   | Missing `WebViewClient` override       | Fix `shouldOverrideUrlLoading`                                      |
| APK > 1 GB                             | Cached webpack artifacts included      | Add `.next/` and `/public/cache` to `.gitignore` and build excludes |

---

## 13. Local Development Workflow

```bash
# Terminal 1
export NEXT_PUBLIC_LOCAL_ANDROID=1
yarn dev # or prod

# Terminal 2: start frontend
export NEXT_PUBLIC_LOCAL_ANDROID=1
yarn build-web # if you made changes to web app  
npx cap sync android
# Run on emulator or device
```

---

## 14. Deployment Workflow

```bash
# 1. Build web app for production
yarn build-web

# 2. Sync assets to Android
npx cap sync android

# 3. Build signed release APK in Android Studio
```

---

## 15. Resources

* [Capacitor Docs](https://capacitorjs.com/docs)
* [Firebase Android Setup](https://firebase.google.com/docs/android/setup)
* [FCM HTTP API](https://firebase.google.com/docs/cloud-messaging/send-message)
* [Next.js Deployment](https://nextjs.org/docs/deployment)


# Useful Commands

- To build the project: `./gradlew assembleDebug`
- To run unit tests: `./gradlew test`
- To run instrumentation tests: `./gradlew connectedAndroidTest`
- To clean the project: `./gradlew clean`
- To install dependencies: Open Android Studio and it will handle dependencies automatically.
- To update dependencies: Modify the `build.gradle` files and sync the project in Android Studio.
- To generate a signed APK: Use the "Generate Signed Bundle / APK..." option in Android Studio.
- To lint the project: `./gradlew lint`
- To check for updates to the Android Gradle Plugin: `./gradlew dependencyUpdates`
- To run the application on a connected device or emulator: `./gradlew installDebug`
- To view the project structure: Use the "Project" view in Android Studio.
- To analyze the APK: `./gradlew analyzeRelease`
- To run ProGuard/R8: `./gradlew minifyRelease`
- To generate documentation: `./gradlew javadoc`

# One time setups

Was already done for Compass, so you only need to do the steps below if you create a project separated from Compass.
## Configure Firebase

### In Firebase Console

1. Add a **Web app** → obtain `firebaseConfig`
2. Add an **Android app**

    * Package name: `com.compassconnections.app`
    * Add your SHA-1 and SHA-256 fingerprints (see below)
    * Download `google-services.json` and put it in:

      ```
      android/app/google-services.json
      ```

### To get SHA-1 for debug keystore

```bash
keytool -list -v \
  -keystore ~/.android/debug.keystore \
  -alias androiddebugkey \
  -storepass android \
  -keypass android
```

Add both SHA-1 and SHA-256 to Firebase.


## 7. Google Sign-In (Web + Native)

In Firebase Console:

* Enable **Google** provider under *Authentication → Sign-in method*
* Add your **Android SHA-1**
* Add your **Web OAuth client ID**

In your code:

```ts
import { googleNativeLogin } from 'web/lib/service/android-push'
```


## 8. Push Notifications (FCM)

### Setup FCM

* Add Firebase Cloud Messaging to your project
* Include `google-services.json` under `android/app/`
* Add in `android/build.gradle`:

  ```gradle
  classpath 'com.google.gms:google-services:4.3.15'
  ```
* Add at the bottom of `android/app/build.gradle`:

  ```gradle
  apply plugin: 'com.google.gms.google-services'
  ```

### Test notification

```ts
const message = {  
  notification: {  
    title: "Test Notification",  
    body: "Hello from Firebase Admin SDK"  
  },  
  token: "..."  
};  
initAdmin()  
await admin.messaging().send(message)  
  .then(response => console.log("Successfully sent message:", response))  
  .catch(error => console.error("Error sending message:", error));
```

---
