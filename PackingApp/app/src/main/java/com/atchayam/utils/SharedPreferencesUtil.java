package com.atchayam.utils;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Created by rajamanickam.r on 4/12/2016.
 */
public class SharedPreferencesUtil {

    public void SaveKeyPairValue(Context context, String text, boolean isFromPurchaseOrder) {
        SharedPreferences poSharedPreferences = context.getSharedPreferences(VendorAppConstants.PREFERENCE_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = poSharedPreferences.edit();
        String Key;
        if (!isFromPurchaseOrder) {
            Key = VendorAppConstants.PREFERENCE_SAVE_STATE_KEY;
        } else {
            Key = VendorAppConstants.PREFERENCE_KEY;
        }

        editor.putString(Key, text);
        editor.commit();
    }

    public void UpdateKeyPairValue(Context context, String text, boolean isFromPurchaseOrder) {
        SharedPreferences poSharedPreferences = context.getSharedPreferences(VendorAppConstants.PREFERENCE_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = poSharedPreferences.edit();
        String Key;
        if (!isFromPurchaseOrder) {
            Key = VendorAppConstants.PREFERENCE_SAVE_STATE_KEY;
        } else {
            Key = VendorAppConstants.PREFERENCE_KEY;
        }

        editor.putString(Key, text);
        editor.apply();
    }

    public String GetKeyPairValue(Context context, boolean isFromPurchaseOrder) {
        SharedPreferences poSharedPreferences = context.getSharedPreferences(VendorAppConstants.PREFERENCE_NAME, Context.MODE_PRIVATE);

        String Key;
        if (!isFromPurchaseOrder) {
            Key = VendorAppConstants.PREFERENCE_SAVE_STATE_KEY;
        } else {
            Key = VendorAppConstants.PREFERENCE_KEY;
        }

        String text = poSharedPreferences.getString(Key, null);
        return text;
    }

    public void ClearKeyPairValue(Context context) {
        SharedPreferences poSharedPreferences = context.getSharedPreferences(VendorAppConstants.PREFERENCE_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = poSharedPreferences.edit();
        editor.clear();
        editor.commit();
    }

    public void RemoveKeyPairValue(Context context, boolean isFromPurchaseOrder) {
        SharedPreferences settings = context.getSharedPreferences(VendorAppConstants.PREFERENCE_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor;
        editor = settings.edit();

        String Key;
        if (!isFromPurchaseOrder) {
            Key = VendorAppConstants.PREFERENCE_SAVE_STATE_KEY;
        } else {
            Key = VendorAppConstants.PREFERENCE_KEY;
        }

        editor.remove(Key);
        editor.commit();
    }
}
