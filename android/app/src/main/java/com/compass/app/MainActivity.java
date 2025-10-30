package com.compass.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

import org.json.JSONException;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    public class NativeBridge {
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
        if (data != null && data.startsWith("com.compassmeet://auth")) {
            Log.i("CompassApp", "triggerWindowJSEvent oauthRedirect");
            try {
                String payload = new JSONObject().put("data", data).toString();
                Log.i("CompassApp", "Payload: " + payload);
                bridge.getWebView().post(() -> {
                    bridge.getWebView().evaluateJavascript("oauthRedirect(" + payload + ");", null);
                });
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
        webView.addJavascriptInterface(new NativeBridge(), "AndroidBridge");

    }

}

