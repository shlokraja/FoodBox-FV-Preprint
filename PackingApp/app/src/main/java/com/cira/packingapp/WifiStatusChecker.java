package com.cira.packingapp;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.util.Log;
import android.webkit.WebView;

public class WifiStatusChecker extends Thread {
    public static final String TAG = "WifiStatusChecker";
    Context mContext;
    WebView mWebview;
    NetworkInfo activeNetwork;
    boolean isConnected;
    boolean isWifi;

    public WifiStatusChecker(Context c, WebView v) {
        mContext = c;
        mWebview = v;
    }

    public void run() {
        Log.d(TAG, "Starting wifi status checker");
        while (true) {
            ConnectivityManager cm =
                    (ConnectivityManager)mContext.getSystemService(Context.CONNECTIVITY_SERVICE);
            activeNetwork = cm.getActiveNetworkInfo();
            if (activeNetwork == null) {
                mWebview.post(new Runnable() {
                    @Override
                    public void run() {
                        mWebview.evaluateJavascript("changeInternetStatus(\"offline\")", null);
                    }
                });
            } else {
                isConnected = activeNetwork != null &&
                        activeNetwork.isConnectedOrConnecting();
                isWifi = activeNetwork.getType() == ConnectivityManager.TYPE_WIFI;
                if (isConnected && isWifi) {
                    mWebview.post(new Runnable() {
                        @Override
                        public void run() {
                            mWebview.evaluateJavascript("changeInternetStatus(\"online\")", null);
                        }
                    });
                } else {
                    mWebview.post(new Runnable() {
                        @Override
                        public void run() {
                            mWebview.evaluateJavascript("changeInternetStatus(\"offline\")", null);
                        }
                    });
                }
            }
            try {
                Thread.sleep(5000);
            } catch (InterruptedException e) {
                Log.e(TAG, e.getMessage());
            }

        }
    }
}
