package com.cira.packingapp;

import android.content.Context;
import android.content.Intent;
import android.os.Environment;
import android.telephony.SmsManager;
import android.util.Log;
import android.view.inputmethod.InputMethodManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.widget.Toast;

import com.atchayam.utils.SharedPreferencesUtil;
import com.example.tscwifidll.TscWifiActivity;

import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.UnsupportedEncodingException;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.Charset;

// Class to respond to events from the web app and run android
// specific code
public class WebAppInterface {
    Context mContext;
    WebView mWebview;
    TscWifiActivity tscDll;
    ArduinoReceiver receiver = null;

    // Instantiate the interface and set context
    WebAppInterface(Context c, WebView v) {
        Log.d(MainActivity.TAG, "In the webinterface constructor");
        mContext = c;
        mWebview = v;
        tscDll = new TscWifiActivity();
    }

    @JavascriptInterface
    public void sendSMS(String mobile_num, String text) {
        Log.d(MainActivity.TAG, "Sending sms to mobile num- " + mobile_num);
        try {
            SmsManager smsManager = SmsManager.getDefault();
            smsManager.sendTextMessage(mobile_num,
                    null,
                    text,
                    null,
                    null);
            Log.d(MainActivity.TAG, "SMS sent");
        } catch (Exception e) {
            Log.e(MainActivity.TAG, e.toString());
        }
    }

    @JavascriptInterface
    public void printTestLabel(String printer_ip) {
        // This will just do some test printing
        // for the printer to re-align itself
        String printerString = loadPrinterFile(mContext, "templates/template.prn");
        Log.d(MainActivity.TAG, "Printing test label from template.prn ");
        // Make the POST request to the raspberry pi
        sendToRPi(printerString, printer_ip);
    }

    @JavascriptInterface
    public void priorLabelPrint(String food_item_id,
                           String veg,
                           String ingredients1a,
                           String ingredients1b,
                           String ingredients2,
                           String ingredients3,
                           String side_order,
                           String vendor_name,
                           String outlet_name,
                           String printer_ip) {

     String printerString = loadPrinterFile(mContext,
                "templates/Template_"+ vendor_name +".prn");
        if (printerString.equalsIgnoreCase("")) {
            // that means some error has happened
            mWebview.post(new Runnable() {
                @Override
                public void run() {
                    mWebview.evaluateJavascript("labelPrinted('Error in loading template file', true)", null);
                }
            });
            return;
        }
        Log.d(MainActivity.TAG, "Loaded printer file");

        // Replace the important tags in the template file
        String ingredients1 = ingredients1a + " " + ingredients1b;
        printerString = printerString.replace("SHTMP_Category_Name", veg);
        printerString = printerString.replace("SHTMP_Ingredients1", ingredients1);
        printerString = printerString.replace("SHTMP_Ingredients2", ingredients2);
        printerString = printerString.replace("SHTMP_Ingredients3", ingredients3);
        printerString = printerString.replace("SHTMP_Sides", side_order);
        printerString = printerString.replace("SHTMP_Ingredients4", "");
        printerString = printerString.replace("SHTMP_Ingredients5", "");
        printerString = printerString.replace("SHTMP_Ingredients6", "");
        printerString = printerString.replace("SHTMP_ItemCode", food_item_id);
        printerString = printerString.replace("SHTMP_Land_Mark", outlet_name);
        // first letter of outlet_name and then food_item_id
        printerString = printerString.replace("SHTMP_Value1",
                outlet_name.substring(0,1) + food_item_id);
        Log.d(MainActivity.TAG, "The new output file is- " + printerString);

        final String result = sendToRPi(printerString, printer_ip);
        if (!result.equalsIgnoreCase("")) {
            // that means some error has happened, trying again
            final String try2 = sendToRPi(printerString, printer_ip);
            if (!try2.equalsIgnoreCase("")) {
                // error
                mWebview.post(new Runnable() {
                    @Override
                    public void run() {
                        mWebview.evaluateJavascript("labelPrinted('"+try2+"', true)", null);
                    }
                });
            } else {
                // it passed on the second try
                mWebview.post(new Runnable() {
                    @Override
                    public void run() {
                        mWebview.evaluateJavascript("labelPrinted('Label printed successfully', false)", null);
                    }
                });
            }

        } else {
            mWebview.post(new Runnable() {
                @Override
                public void run() {
                    mWebview.evaluateJavascript("labelPrinted('Label printed successfully', false)", null);
                }
            });
        }
    }

    @JavascriptInterface
    public void printLabel(String food_item_id,
                           String veg,
                           String ingredients1a,
                           String ingredients1b,
                           String ingredients2,
                           String ingredients3,
                           String side_order,
                           String vendor_name,
                           String outlet_name,
                           final String barcode,
                           String time,
                           String printer_ip,
                           final String datamatrixcode,
                           final String source) {

        mWebview.post(new Runnable() {
            @Override
            public void run() {
                mWebview.evaluateJavascript("barcodePrinted('" + barcode + "','"+datamatrixcode+"', false, '" + source + "')", null);
            }
        });
    }

    @JavascriptInterface
    public void sendMailToHQ(String address, String subject, String body) {
        Intent i = new Intent(Intent.ACTION_SEND);
        i.setType("message/rfc822");
        i.putExtra(Intent.EXTRA_EMAIL  , new String[]{address});
        i.putExtra(Intent.EXTRA_SUBJECT, subject);
        i.putExtra(Intent.EXTRA_TEXT, body);
        try {
            Log.d(MainActivity.TAG, "Sending mail..");
            (mContext).startActivity(Intent.createChooser(i, "Send mail..."));
        } catch (android.content.ActivityNotFoundException ex) {
            Toast.makeText(mContext, "There are no email clients installed.",
                    Toast.LENGTH_SHORT).show();
            Log.e(MainActivity.TAG, "There are no mail clients installed");
        }
        Log.i(MainActivity.TAG, "Successfully sent mail");
    }

    // Helper function to load the printer template file
    private String loadPrinterFile(Context context, String name) {
        InputStream inputStream;

        byte[] bFile = null;
        try {
            File rootFile = Environment.getExternalStorageDirectory();
            File textFile = new File(rootFile.getAbsolutePath()+ File.separator + name);

            bFile = new byte[(int)textFile.length()];
            //convert file into array of bytes
            inputStream = new FileInputStream(textFile);
            inputStream.read(bFile);
            inputStream.close();
        }catch(Exception e){
            Log.e(MainActivity.TAG, e.getMessage());
        }
        Charset isoCharset = Charset.forName("ISO-8859-1");
        String content = new String (bFile, isoCharset);
        return content;
    }

    @JavascriptInterface
    public String sendTestToRpi(String printer_ip) {
        HttpURLConnection httpcon;
        String result = "";
        try{
            //Connect
            httpcon = (HttpURLConnection) ((new URL("http://" + printer_ip + "/test").openConnection()));
            httpcon.setDoOutput(true);
            httpcon.setRequestMethod("GET");
            httpcon.setConnectTimeout(2000);
            httpcon.setReadTimeout(1000);
            httpcon.connect();

            //Read
            BufferedReader br = new BufferedReader(new InputStreamReader(
                    httpcon.getInputStream(),"UTF-8"));

            String line;
            StringBuilder sb = new StringBuilder();

            while ((line = br.readLine()) != null) {
                sb.append(line);
            }

            br.close();
            Log.d(MainActivity.TAG, sb.toString());
        } catch (UnsupportedEncodingException e) {
            Log.e(MainActivity.TAG, e.getMessage());
            result = e.getMessage();
        } catch (IOException e) {
            Log.e(MainActivity.TAG, e.getMessage());
            result = e.getMessage();
        } finally {
            return result;
        }
    }

    private String sendToRPi(String printerString, String printer_ip) {
        HttpURLConnection httpcon;
        Log.d(MainActivity.TAG, printerString);
        String result = "";
        try{
            //Connect
            httpcon = (HttpURLConnection) ((new URL("http://" + printer_ip).openConnection()));
            httpcon.setDoOutput(true);
            httpcon.setRequestProperty("Content-Type", "binary/octet-stream");
            httpcon.setRequestProperty("Content-transfer-encoding", "binary");
            httpcon.setRequestMethod("POST");
            httpcon.setConnectTimeout(2000);
            httpcon.setReadTimeout(1000);
            httpcon.connect();

            //Write
            DataOutputStream os = new DataOutputStream(httpcon.getOutputStream());
            Charset isoCharset = Charset.forName("ISO-8859-1");
            os.write(printerString.getBytes(isoCharset));
            os.close();

            // Error
            if (httpcon.getResponseCode() == 500){
                result = "Unable to print";
                Log.d(MainActivity.TAG, result);
            }
            else {
                //Read
                BufferedReader br = new BufferedReader(new InputStreamReader(
                        httpcon.getInputStream(),"UTF-8"));

                String line;
                StringBuilder sb = new StringBuilder();

                while ((line = br.readLine()) != null) {
                    sb.append(line);
                }

                br.close();
                Log.d(MainActivity.TAG, sb.toString());
            }
        } catch (UnsupportedEncodingException e) {
            Log.e(MainActivity.TAG, e.getMessage());
            result = "Unable to print";
        } catch (IOException e) {
            Log.e(MainActivity.TAG, e.getMessage());
            if (e.getMessage().contains("Server returned HTTP response")) {
                result = "Unable to print";
            } else {
                result = "Unable to connect";
            }
        } finally {
            return result;
        }
    }

    @JavascriptInterface
    public void SendPODataToSP(String poDataString, boolean isFromPurchaseOrder) {
        SharedPreferencesUtil sharedPreferencesUtil = new SharedPreferencesUtil();
        sharedPreferencesUtil.SaveKeyPairValue(mContext, poDataString, isFromPurchaseOrder);
    }

    @JavascriptInterface
    public void UpdatePODataToSP(String poDataString, boolean isFromPurchaseOrder) {
        SharedPreferencesUtil sharedPreferencesUtil = new SharedPreferencesUtil();
        sharedPreferencesUtil.UpdateKeyPairValue(mContext, poDataString, isFromPurchaseOrder);
    }

    @JavascriptInterface
    public String GetPODataFromSP(boolean isFromPurchaseOrder) {
        SharedPreferencesUtil sharedPreferencesUtil = new SharedPreferencesUtil();
        String poData = sharedPreferencesUtil.GetKeyPairValue(mContext, isFromPurchaseOrder);
        return poData;
    }

    @JavascriptInterface
    public void RemoveKeyPairValue(boolean isFromPurchaseOrder) {
        SharedPreferencesUtil sharedPreferencesUtil = new SharedPreferencesUtil();
        sharedPreferencesUtil.RemoveKeyPairValue(mContext, isFromPurchaseOrder);
    }

    @JavascriptInterface
    public void notEdit() {
        InputMethodManager imm = (InputMethodManager) this.mContext.getSystemService(Context.INPUT_METHOD_SERVICE);
        //if (imm.isActive(webView)) {
        imm.hideSoftInputFromWindow(mWebview.getWindowToken(), 0);
        //}
    }
}