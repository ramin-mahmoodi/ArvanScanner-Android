package com.arvan.scanner;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends Activity {
    private WebView webView;
    private ScannerTask currentScanner;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);
        
        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());
        
        webView.addJavascriptInterface(new WebAppInterface(), "AndroidBridge");
        
        webView.loadUrl("file:///android_asset/index.html");
    }

    public class WebAppInterface {
        @JavascriptInterface
        public void StartScan(String jsonParams) {
            try {
                if (currentScanner != null) {
                    currentScanner.stop();
                }

                JSONObject req = new JSONObject(jsonParams);
                JSONArray cidrsArray = req.getJSONArray("cidrs");
                String[] cidrs = new String[cidrsArray.length()];
                for (int i = 0; i < cidrsArray.length(); i++) {
                    cidrs[i] = cidrsArray.getString(i);
                }
                
                int concurrency = req.getInt("concurrency");
                String mode = req.getString("mode");
                String sni = req.optString("sni", "");
                
                JSONArray portsArray = req.getJSONArray("ports");
                String[] ports = new String[portsArray.length()];
                for (int i = 0; i < portsArray.length(); i++) {
                    ports[i] = portsArray.getString(i);
                }

                currentScanner = new ScannerTask(MainActivity.this, webView);
                currentScanner.startScan(cidrs, concurrency, mode, sni, ports);

            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void StopScan() {
            if (currentScanner != null) {
                currentScanner.stop();
            }
        }
    }
}
