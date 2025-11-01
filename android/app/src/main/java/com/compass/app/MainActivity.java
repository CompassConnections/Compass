package com.compass.app;

import android.Manifest;
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

import com.capacitorjs.plugins.pushnotifications.PushNotificationsPlugin;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

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

    public static class NativeBridge {
        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        String data = intent.getDataString();
        Log.i("CompassApp", "onNewIntent called with data: " + data);
//        if (data != null && data.startsWith("com.compassmeet://auth")) {
//            Log.i("CompassApp", "triggerWindowJSEvent oauthRedirect");
//            try {
//                String payload = new JSONObject().put("data", data).toString();
//                Log.i("CompassApp", "Payload: " + payload);
//                bridge.getWebView().post(() -> bridge.getWebView().evaluateJavascript("oauthRedirect(" + payload + ");", null));
//            } catch (JSONException e) {
//                Log.i("CompassApp", "Failed to encode JSON payload", e);
//            }
//        } else {
//            Log.i("CompassApp", "No relevant data");
//        }
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
        webView.addJavascriptInterface(new NativeBridge(), "AndroidBridge");

        registerPlugin(PushNotificationsPlugin.class);
        // Initialize the Bridge with Push Notifications plugin
//       this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
//           add(com.getcapacitor.plugin.PushNotifications.class);
//       }});

        askNotificationPermission();
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
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {}
}

