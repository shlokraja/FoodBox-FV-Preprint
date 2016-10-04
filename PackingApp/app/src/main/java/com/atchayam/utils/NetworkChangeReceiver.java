package com.atchayam.utils;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;
import android.webkit.WebView;

/**
 * Created by rajamanickam.r on 5/2/2016.
 */
public class NetworkChangeReceiver extends BroadcastReceiver {

    Context mContext;
    WebView mWebview;

    public NetworkChangeReceiver(Context c, WebView v) {
        mContext = c;
        mWebview = v;
    }

    @Override
    public void onReceive(final Context context, final Intent intent) {
        ConnectivityManager cm =
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);

        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        boolean isConnected = activeNetwork != null &&
                activeNetwork.isConnectedOrConnecting();

        if (isConnected) {
        }
    }
}
