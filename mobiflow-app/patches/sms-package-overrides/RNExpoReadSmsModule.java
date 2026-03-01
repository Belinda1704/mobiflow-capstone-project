
package com.reactlibrary;

import android.Manifest;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import androidx.core.content.ContextCompat;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.WritableArray;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

import java.util.Arrays;

public class RNExpoReadSmsModule extends ReactContextBaseJavaModule {

  private final ReactApplicationContext reactContext;
  private BroadcastReceiver msgReceiver;
  public static final String NAME = "RNExpoReadSms";

  public RNExpoReadSmsModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.reactContext = reactContext;
  }

  @Override
  public String getName() {
    return NAME;
  }

  @ReactMethod
  public void startReadSMS(final Callback success, final Callback error) {
    try{
      if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
              && ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
        msgReceiver = new BroadcastReceiver() {
          @Override
          public void onReceive(Context context, Intent intent) {
            reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
                    .emit("received_sms", getMessageFromMessageIntent(intent));
          }
        };
        String SMS_RECEIVED_ACTION = "android.provider.Telephony.SMS_RECEIVED";
        if(Build.VERSION.SDK_INT >= 34 && reactContext.getApplicationInfo().targetSdkVersion >= 34) {
          reactContext.registerReceiver(msgReceiver, new IntentFilter(SMS_RECEIVED_ACTION), Context.RECEIVER_EXPORTED);
        } else {
          reactContext.registerReceiver(msgReceiver, new IntentFilter(SMS_RECEIVED_ACTION));
        }
        success.invoke("Start Read SMS successfully");
      } else {
        error.invoke("Required RECEIVE_SMS and READ_SMS permission");
      }
    } catch (Exception e){
      e.printStackTrace();
    }
  }

  @ReactMethod
  public void stopReadSMS() {
    try {
      if (reactContext != null && msgReceiver != null) {
        reactContext.unregisterReceiver(msgReceiver);
      }
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  @ReactMethod
  public void readPastSMS(int limit, Promise promise) {
    try {
      if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "READ_SMS permission required to scan past messages");
        return;
      }
      Uri uri = Uri.parse("content://sms/inbox");
      String[] projection = new String[] { "body", "address", "date" };
      String sortOrder = "date DESC LIMIT " + Math.min(Math.max(1, limit), 5000);
      Cursor cursor = null;
      try {
        cursor = reactContext.getContentResolver().query(uri, projection, null, null, sortOrder);
        WritableArray list = Arguments.createArray();
        if (cursor != null) {
          int bodyIdx = cursor.getColumnIndex("body");
          int addrIdx = cursor.getColumnIndex("address");
          int dateIdx = cursor.getColumnIndex("date");
          while (cursor.moveToNext()) {
            WritableMap map = Arguments.createMap();
            map.putString("body", bodyIdx >= 0 ? cursor.getString(bodyIdx) : "");
            map.putString("address", addrIdx >= 0 ? cursor.getString(addrIdx) : "");
            long dateMs = dateIdx >= 0 ? cursor.getLong(dateIdx) : 0;
            map.putDouble("timestamp", dateMs);
            list.pushMap(map);
          }
        }
        promise.resolve(list);
      } finally {
        if (cursor != null) cursor.close();
      }
    } catch (Exception e) {
      Log.e("ReadSMSModule", "readPastSMS error", e);
      promise.reject("READ_FAILED", e.getMessage());
    }
  }

  @ReactMethod
  public void readPastSentSMS(int limit, Promise promise) {
    try {
      if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "READ_SMS permission required to scan sent messages");
        return;
      }
      Uri uri = Uri.parse("content://sms/sent");
      String[] projection = new String[] { "body", "address", "date" };
      String sortOrder = "date DESC LIMIT " + Math.min(Math.max(1, limit), 5000);
      Cursor cursor = null;
      try {
        cursor = reactContext.getContentResolver().query(uri, projection, null, null, sortOrder);
        WritableArray list = Arguments.createArray();
        if (cursor != null) {
          int bodyIdx = cursor.getColumnIndex("body");
          int addrIdx = cursor.getColumnIndex("address");
          int dateIdx = cursor.getColumnIndex("date");
          while (cursor.moveToNext()) {
            WritableMap map = Arguments.createMap();
            map.putString("body", bodyIdx >= 0 ? cursor.getString(bodyIdx) : "");
            map.putString("address", addrIdx >= 0 ? cursor.getString(addrIdx) : "");
            long dateMs = dateIdx >= 0 ? cursor.getLong(dateIdx) : 0;
            map.putDouble("timestamp", dateMs);
            list.pushMap(map);
          }
        }
        promise.resolve(list);
      } finally {
        if (cursor != null) cursor.close();
      }
    } catch (Exception e) {
      Log.e("ReadSMSModule", "readPastSentSMS error", e);
      promise.reject("READ_FAILED", e.getMessage());
    }
  }

  private String getMessageFromMessageIntent(Intent intent) {
    final Bundle bundle = intent.getExtras();
    // [0] = sender address, [1] = message body
    String SMSReturnValues [] = new String [2];

    try {
      if (bundle != null) {
        final Object[] pdusObj = (Object[]) bundle.get("pdus");
        if (pdusObj != null) {
          for (Object aPdusObj : pdusObj) {
            SmsMessage currentMessage = SmsMessage.createFromPdu((byte[]) aPdusObj);
            SMSReturnValues[0] = currentMessage.getDisplayOriginatingAddress();
            SMSReturnValues[1] = currentMessage.getDisplayMessageBody();
          }
        }
      }
      Log.i("ReadSMSModule", "SMS Originating Address received is:"+SMSReturnValues[0]);
      Log.i("ReadSMSModule", "SMS received is:"+SMSReturnValues[1]);
    } catch (Exception e) {
      e.printStackTrace();
    }

    final String finalSMSReturnValues = Arrays.toString(SMSReturnValues);
    return finalSMSReturnValues;
  }
}
