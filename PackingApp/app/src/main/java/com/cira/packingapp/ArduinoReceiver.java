package com.cira.packingapp;

import android.bluetooth.BluetoothSocket;
import android.content.Context;
import android.util.Log;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;

public class ArduinoReceiver extends Thread {
    private final BluetoothSocket mmSocket;
    private final InputStream mmInStream;
    private final OutputStream mmOutStream;
    Context mContext;

    public static final String TAG = ArduinoReceiver.class.getSimpleName();

    public ArduinoReceiver(Context c, BluetoothSocket socket) {
        mContext = c;
        mmSocket = socket;
        InputStream tmpIn = null;
        OutputStream tmpOut = null;
        // Get the input and output streams, using temp objects because
        // member streams are final
        try {
            socket.connect();
            tmpIn = socket.getInputStream();
            tmpOut = socket.getOutputStream();
        } catch (IOException e) {
            Log.e(TAG, e.getMessage());
        }

        mmInStream = tmpIn;
        mmOutStream = tmpOut;
    }

    public void run() {
        byte[] buffer = new byte[1024];  // buffer store for the stream
        int bytes; // bytes returned from read()
        String s;
        Log.d(TAG, "Arduino loop has started");
        // Keep listening to the InputStream until an exception occurs
        while (true) {
            try {
                // Read from the InputStream
                bytes = mmInStream.read(buffer);
                byte[] newArray = Arrays.copyOfRange(buffer, 0, bytes);
                s = new String(newArray);
                Log.d(TAG, "Received from arduino- " + s +
                                        "Bytes read- " + bytes);
                // Send message to main activity that a signal has been received.
                ((MainActivity) mContext).sealingComplete();
            } catch (IOException e) {
                Log.e(TAG, e.getMessage());
                break;
            } catch (NullPointerException e) {
                Log.e(TAG, "Bluetooth device is not active");
                break;
            }
        }
    }

    /* Call this from the main activity to send data to the remote device */
    public void write(byte[] bytes) {
        try {
            mmOutStream.write(bytes);
        } catch (IOException e) { }
        catch (Exception e) {}
    }

    /* Call this from the main activity to shutdown the connection */
    public void cancel() {
        try {
            mmInStream.close();
            mmOutStream.close();
            mmSocket.close();
        } catch (IOException e) {
            Log.e(TAG, "IOException in closing bluetooth connection");
        }
        catch (Exception e) {
            Log.e(TAG, "Exception in closing bluetooth connection");
        }
    }
}