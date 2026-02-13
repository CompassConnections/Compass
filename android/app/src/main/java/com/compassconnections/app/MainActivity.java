package com.compassconnections.app;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.RequiresApi;
import androidx.core.content.ContextCompat;

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;
import com.google.android.play.core.appupdate.AppUpdateInfo;
import com.google.android.play.core.appupdate.AppUpdateManager;
import com.google.android.play.core.appupdate.AppUpdateManagerFactory;
import com.google.android.play.core.appupdate.AppUpdateOptions;
import com.google.android.play.core.install.model.AppUpdateType;
import com.google.android.play.core.install.model.UpdateAvailability;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {

    // Declare this at class level
    private final ActivityResultLauncher<String> requestPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), isGranted -> {
                if (isGranted) {
                    Log.i("CompassApp", "Permission granted");
                    // Permission granted – you can show notifications
                } else {
                    Log.i("CompassApp", "Permission denied");
                    // Permission denied – handle gracefully
                }
            });

    private void askNotificationPermission() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) { // API 33
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                // Permission not yet granted; request it
                requestPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
    }

    public class WebAppInterface {
        private final Context context;

        public WebAppInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void downloadFile(String filename, String content) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+ (API 29+) - Use MediaStore
                    downloadFileModern(filename, content);
                } else {
                    // Android 9 and below - Use legacy method
                    downloadFileLegacy(filename, content);
                }

                // Show success message
                runOnUiThread(() ->
                        Toast.makeText(MainActivity.this, "File downloaded: " + filename, Toast.LENGTH_SHORT).show()
                );

            } catch (IOException e) {
                Log.e("CompassApp", "Failed to download file", e);
                runOnUiThread(() ->
                        Toast.makeText(MainActivity.this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show()
                );
            }
        }

        // For Android 10+ (Scoped Storage)
        @RequiresApi(api = Build.VERSION_CODES.Q)
        private void downloadFileModern(String filename, String content) throws IOException {
            ContentResolver resolver = getContentResolver();
            ContentValues contentValues = new ContentValues();
            contentValues.put(MediaStore.MediaColumns.DISPLAY_NAME, filename);
            contentValues.put(MediaStore.MediaColumns.MIME_TYPE, getMimeType(filename));
            contentValues.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

            Uri uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, contentValues);
            if (uri != null) {
                try (OutputStream outputStream = resolver.openOutputStream(uri)) {
                    if (outputStream != null) {
                        outputStream.write(content.getBytes(StandardCharsets.UTF_8));
                    }
                }
            }
        }

        // For Android 9 and below
        private void downloadFileLegacy(String filename, String content) throws IOException {
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            if (!downloadsDir.exists()) {
                downloadsDir.mkdirs();
            }

            File file = getUniqueFile(downloadsDir, filename);
            try (FileOutputStream fos = new FileOutputStream(file)) {
                fos.write(content.getBytes(StandardCharsets.UTF_8));
            }

            MediaScannerConnection.scanFile(context, new String[]{file.getAbsolutePath()}, null, null);
        }

        private File getUniqueFile(File directory, String filename) {
            File file = new File(directory, filename);
            if (!file.exists()) {
                return file;
            }

            // Add number suffix if file exists
            String name = filename.substring(0, filename.lastIndexOf("."));
            String extension = filename.substring(filename.lastIndexOf("."));

            int counter = 1;
            while (file.exists()) {
                file = new File(directory, name + "(" + counter + ")" + extension);
                counter++;
            }
            return file;
        }

        // Helper method to determine MIME type
        private String getMimeType(String filename) {
            String extension = filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
            return switch (extension) {
                case "txt" -> "text/plain";
                case "pdf" -> "application/pdf";
                case "json" -> "application/json";
                case "csv" -> "text/csv";
                case "html" -> "text/html";
                case "jpg", "jpeg" -> "image/jpeg";
                case "png" -> "image/png";
                default -> "application/octet-stream";
            };
        }

    }


    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

//        String data = intent.getDataString();
        String endpoint = intent.getStringExtra("endpoint");
        Log.i("CompassApp", "onNewIntent called with endpoint: " + endpoint);
        if (endpoint != null) {
            Log.i("CompassApp", "redirecting to endpoint: " + endpoint);
            try {
                String payload = new JSONObject().put("endpoint", endpoint).toString();
                Log.i("CompassApp", "Payload: " + payload);
                bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("bridgeRedirect(" + payload + ");", null));
            } catch (JSONException e) {
                Log.i("CompassApp", "Failed to encode JSON payload", e);
            }
        } else {
            Log.i("CompassApp", "No relevant data");
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.i("CompassApp", "onCreate called");
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        webView.setWebViewClient(new BridgeWebViewClient(this.bridge));

        WebView.setWebContentsDebuggingEnabled(true);

        // Set a recognizable User-Agent (always reliable)
        WebSettings settings = webView.getSettings();
        settings.setUserAgentString(settings.getUserAgentString() + " CompassAppWebView");

        settings.setJavaScriptEnabled(true);
        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");

        registerPlugin(PushNotificationsPlugin.class);
        // Initialize the Bridge with Push Notifications plugin
//       this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
//           add(com.getcapacitor.plugin.PushNotifications.class);
//       }});

        askNotificationPermission();

        appUpdateManager = AppUpdateManagerFactory.create(this);
        checkForUpdates();
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("CompassApp", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("CompassApp", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            Log.i("CompassApp", "handleGoogleLoginIntent");
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    // This function will never be called, leave it empty
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
    }

    private static final int UPDATE_REQUEST_CODE = 500;
    private AppUpdateManager appUpdateManager;
    private static final String TAG = "MainActivity";

    private void checkForUpdates() {
        appUpdateManager.getAppUpdateInfo()
                .addOnSuccessListener(appUpdateInfo -> {
                    if (appUpdateInfo.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE) {
                        if (appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
                            startImmediateUpdate(appUpdateInfo);
                        } else if (appUpdateInfo.isUpdateTypeAllowed(AppUpdateType.FLEXIBLE)) {
                            startFlexibleUpdate(appUpdateInfo);
                        }
                    }
                })
                .addOnFailureListener(exception -> {
                    // Handle error - log it
                    Log.e(TAG, "Failed to check For Updates", exception);
                });
    }

    private void startImmediateUpdate(AppUpdateInfo appUpdateInfo) {
        AppUpdateOptions options = AppUpdateOptions.newBuilder(AppUpdateType.IMMEDIATE).build();

        appUpdateManager.startUpdateFlow(appUpdateInfo, this, options)
                .addOnSuccessListener(result -> {
                    Log.i(TAG, "Immediate update started successfully");
                })
                .addOnFailureListener(exception -> {
                    Log.e(TAG, "Failed to start immediate update", exception);
                });
    }

    private void startFlexibleUpdate(AppUpdateInfo appUpdateInfo) {
        AppUpdateOptions options = AppUpdateOptions.newBuilder(AppUpdateType.FLEXIBLE).build();

        appUpdateManager.startUpdateFlow(appUpdateInfo, this, options)
                .addOnSuccessListener(result -> {
                    Log.i(TAG, "Flexible update started successfully");
                })
                .addOnFailureListener(exception -> {
                    Log.e(TAG, "Failed to start flexible update", exception);
                });
    }


    @Override
    public void onResume() {
        super.onResume();

        // Check if an immediate update was interrupted
        appUpdateManager.getAppUpdateInfo().addOnSuccessListener(appUpdateInfo -> {
            if (appUpdateInfo.updateAvailability() == UpdateAvailability.DEVELOPER_TRIGGERED_UPDATE_IN_PROGRESS) {
                startImmediateUpdate(appUpdateInfo);
            }
        });
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        appUpdateManager = null;
    }
}

