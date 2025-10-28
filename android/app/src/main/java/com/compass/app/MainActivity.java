package com.compass.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    public class NativeBridge {
        @JavascriptInterface
        public boolean isNativeApp() {
            return true;
        }
    }

    private static final String LOCAL_URL = "file:///android_asset/public/server/pages";
    private static final String REMOTE_URL = "https://www.compassmeet.com";

    // Optional helper for future use
    public void loadLocalContent() {
        Log.i("CompassApp", "Loading local assets...");
        this.bridge.getWebView().loadUrl(LOCAL_URL);
    }

    public void loadRemoteContent() {
        Log.i("CompassApp", "Loading remote content...");
        this.bridge.getWebView().loadUrl(REMOTE_URL);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.bridge.getWebView();
        webView.setWebViewClient(new BridgeWebViewClient(this.bridge));

        WebView.setWebContentsDebuggingEnabled(true);

        // Set a recognizable User-Agent (always reliable)
        webView.getSettings().setUserAgentString(
                webView.getSettings().getUserAgentString() + " CompassAppWebView"
        );

        webView.getSettings().setJavaScriptEnabled(true);
        webView.addJavascriptInterface(new NativeBridge(), "AndroidBridge");

        // Allow remote URLs to still have access to Capacitor bridge
//        webView.setWebViewClient(new BridgeWebViewClient(this.bridge) {
//            @Override
//            public boolean shouldOverrideUrlLoading(android.webkit.WebView view, String url) {
//                if (url.startsWith("https://www.compassmeet.com")) {
//                    view.loadUrl(url);
//                    return true;
//                }
//                return super.shouldOverrideUrlLoading(view, url);
//            }
//        });
//
//        // Load your remote site instead of local assets
//        this.bridge.getWebView().loadUrl("https://www.compassmeet.com");
    }

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        Log.i("Google Activity Result", "onActivityResult called with requestCode: " + requestCode + data);

        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle == null) {
                Log.i("Google Activity Result", "SocialLogin login handle is null");
                return;
            }
            Plugin plugin = pluginHandle.getInstance();
            if (!(plugin instanceof SocialLoginPlugin)) {
                Log.i("Google Activity Result", "SocialLogin plugin instance is not SocialLoginPlugin");
                return;
            }
            Log.i("Google Activity Result", "Handling Google login intent");
            ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
        }
    }

    // This function will never be called, leave it empty
    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
    }
}

