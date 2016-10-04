package com.cira.packingapp;

import android.app.Activity;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothDevice;
import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.content.Intent;
import android.net.wifi.WifiManager;
import android.os.Bundle;
import android.os.ParcelUuid;
import android.util.Log;
import android.view.KeyEvent;
import android.view.Menu;
import android.view.MenuItem;
import android.webkit.ConsoleMessage;
import android.webkit.WebChromeClient;
import android.webkit.WebView;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

public class MainActivity extends Activity {

    public static final String TAG = MainActivity.class.getSimpleName();
    public static final int REQUEST_ENABLE_BT = 0;

    public WebView webView;
    public WifiStatusChecker checker;
    private WifiManager.WifiLock wifiLock;
    public ArrayList<ArduinoReceiver> arduinoReceivers = new ArrayList<>();
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Creating the wifiLock
        wifiLock = ((WifiManager) getSystemService(Context.WIFI_SERVICE)).createWifiLock(WifiManager.WIFI_MODE_FULL, "LockTag");

        // Making the webview debuggable from Chrome
        WebView.setWebContentsDebuggingEnabled(true);
        webView = (WebView) findViewById(R.id.webview);
        // Enabling javascript
        webView.getSettings().setJavaScriptEnabled(true);
        // Enabling these so that html5 storage works
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setDatabaseEnabled(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(false);
        webView.loadUrl("file:///android_asset/index.html");
        // Adding the javascript interface
        webView.addJavascriptInterface(new WebAppInterface(this, webView), "Android");
        webView.setWebChromeClient(new WebChromeClient() {
            public boolean onConsoleMessage(ConsoleMessage cm) {
                Log.d(TAG, cm.message() + " -- From line "
                        + cm.lineNumber() + " of "
                        + cm.sourceId());
                return true;
            }
        });

        // Starting the wifi status checker
        // This will keep checking if wifi is present or not and call
        // the appropriate UI function
        checker = new WifiStatusChecker(this, webView);
        checker.start();
    }

    @Override
    protected void onStart() {
        wifiLock.acquire();
        super.onStart();
    }

    @Override
    protected void onStop() {
        wifiLock.release();
        super.onStop();
    }

    @Override
    protected void onResume() {
        super.onResume();
        Log.d(TAG, "On resume called");
        // restarting the arduino connections again
        initializeArduino();
    }

    @Override
    protected  void onPause() {
        super.onPause();
        Log.d(TAG, "Shutting down arduino connections");
        // shutting down the arduino
        for (ArduinoReceiver receiver : arduinoReceivers) {
            receiver.cancel();
        }
        // Clearing the list
        arduinoReceivers.clear();
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        // Inflate the menu; this adds items to the action bar if it is present.
        getMenuInflater().inflate(R.menu.menu, menu);
        return true;
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK ) {
            Log.d(TAG, "Back button pressed");
        }
        return super.onKeyDown(keyCode, event);
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle action bar item clicks here. The action bar will
        // automatically handle clicks on the Home/Up button, so long
        // as you specify a parent activity in AndroidManifest.xml.
        int id = item.getItemId();

        //noinspection SimplifiableIfStatement
        if (id == R.id.action_settings) {
            return true;
        }

        return super.onOptionsItemSelected(item);
    }

    // The callback when an exterior activity fulfils its result
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        switch (requestCode) {
        }
    }

    // Send signal to app that a barcode has been printed
    public void sealingComplete() {
        webView.post(new Runnable() {
            @Override
            public void run() {
                webView.evaluateJavascript("sealingComplete()", null);
            }
        });
    }

    public void initializeArduino() {
        Log.i(MainActivity.TAG, "Initializing Arduino");
        if (BluetoothAdapter.getDefaultAdapter() == null) {
            Log.e(MainActivity.TAG, "Bluetooth adapter not found !");
            return;
        }

        if (!BluetoothAdapter.getDefaultAdapter().isEnabled()) {
            Log.i(MainActivity.TAG, "Switching bluetooth on");
            Intent enableBtIntent = new Intent(BluetoothAdapter.ACTION_REQUEST_ENABLE);
            startActivityForResult(enableBtIntent, MainActivity.REQUEST_ENABLE_BT);
        } else {
            Log.i(MainActivity.TAG, " Bluetooth is on ");

            // Iterating and filtering through the list of paired devices
            Set<BluetoothDevice> pairedDevices = BluetoothAdapter.getDefaultAdapter().getBondedDevices();

            for (BluetoothDevice device : pairedDevices) {
                Log.d(MainActivity.TAG, "Device is- " + device.getName());
                // This is for the main sealer
                if (device.getName().toLowerCase().startsWith("hc-") ) {
                    // got a match, storing it in shared pref
                    Log.i(MainActivity.TAG, "Matching arduino device found - " + device.getName());
                    ParcelUuid[] uuids = device.getUuids();
                    try {
                        BluetoothSocket socket = device.createRfcommSocketToServiceRecord(uuids[0].getUuid());
                        ArduinoReceiver receiver = new ArduinoReceiver(this, socket);
                        receiver.start();
                        arduinoReceivers.add(receiver);
                    } catch (IOException e) {
                        Log.e(MainActivity.TAG, e.getMessage());
                    }
                }
            }
        }
    }

}
