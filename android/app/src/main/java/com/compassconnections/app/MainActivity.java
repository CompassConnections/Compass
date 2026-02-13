package com.compassconnections.app;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.core.content.ContextCompat;
import androidx.core.content.FileProvider;

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.compassconnections.app.MainActivity.WebAppInterface;
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

    public static class WebAppInterface {
        private final Context context;

        public WebAppInterface(Context context) {
            this.context = context;
        }

        @JavascriptInterface
        public void downloadFile(String filename, String content) {
            try {
                // Create file in app-specific external storage
                File file = new File(context.getExternalFilesDir(null), filename);

                // Write content to file
                FileOutputStream fos = new FileOutputStream(file);
                fos.write(content.getBytes());
                fos.close();

                // Get URI via FileProvider
                String authority = context.getPackageName() + ".provider";
                android.net.Uri uri = FileProvider.getUriForFile(context, authority, file);

                // Launch intent to view/share file
                Intent intent = new Intent(Intent.ACTION_VIEW);
                intent.setDataAndType(uri, "application/json");
                intent.setFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);

                context.startActivity(intent);

            } catch (IOException e) {
                Log.i("CompassApp", "Failed to download file", e);
            }
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

