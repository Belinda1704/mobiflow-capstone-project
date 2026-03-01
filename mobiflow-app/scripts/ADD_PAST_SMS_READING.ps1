# Add readPastSMS method to SMS library for reading past SMS messages
# Run from mobiflow-app folder: .\scripts\ADD_PAST_SMS_READING.ps1
# This adds functionality to scan past SMS messages from inbox

$file = "node_modules\@maniac-tech\react-native-expo-read-sms\android\src\main\java\com\reactlibrary\RNExpoReadSmsModule.java"
if (-not (Test-Path $file)) {
    Write-Host "ERROR: File not found: $file" -ForegroundColor Red
    exit 1
}

$content = Get-Content $file -Raw

# Check if readPastSMS method already exists
if ($content -match '@ReactMethod.*readPastSMS') {
    Write-Host "readPastSMS method already exists in SMS library." -ForegroundColor Green
    exit 0
}

Write-Host "Adding readPastSMS method to SMS library..." -ForegroundColor Yellow

# Add imports if needed
if ($content -notmatch 'import android\.content\.ContentResolver') {
    $content = $content -replace '(import android\.content\.IntentFilter;)', "`$1`nimport android.content.ContentResolver;`nimport android.database.Cursor;`nimport android.net.Uri;"
}

if ($content -notmatch 'import com\.facebook\.react\.bridge\.Promise') {
    $content = $content -replace '(import com\.facebook\.react\.bridge\.Callback;)', "`$1`nimport com.facebook.react.bridge.Promise;`nimport com.facebook.react.bridge.WritableArray;`nimport com.facebook.react.bridge.Arguments;`nimport com.facebook.react.bridge.WritableMap;"
}

# Add the readPastSMS method before the closing brace
$methodToAdd = @"

  @ReactMethod
  public void readPastSMS(int limit, Promise promise) {
    try {
      // Check permissions
      if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
        promise.reject("PERMISSION_DENIED", "READ_SMS permission not granted");
        return;
      }

      ContentResolver contentResolver = reactContext.getContentResolver();
      Uri uri = Uri.parse("content://sms/inbox");
      String[] projection = new String[]{"address", "body", "date"};
      String selection = "body LIKE ? OR body LIKE ? OR body LIKE ? OR body LIKE ? OR body LIKE ?";
      String[] selectionArgs = new String[]{"%RWF%", "%momo%", "%MTN%", "%M-Money%", "%Airtel%"};
      String sortOrder = "date DESC LIMIT " + limit;
      
      Cursor cursor = contentResolver.query(uri, projection, selection, selectionArgs, sortOrder);
      
      if (cursor == null) {
        promise.reject("ERROR", "Failed to read SMS: cursor is null");
        return;
      }
      
      WritableArray smsList = Arguments.createArray();
      
      while (cursor.moveToNext()) {
        String address = cursor.getString(cursor.getColumnIndexOrThrow("address"));
        String body = cursor.getString(cursor.getColumnIndexOrThrow("body"));
        long timestamp = cursor.getLong(cursor.getColumnIndexOrThrow("date"));
        
        WritableMap smsMap = Arguments.createMap();
        smsMap.putString("address", address != null ? address : "");
        smsMap.putString("body", body != null ? body : "");
        smsMap.putDouble("timestamp", timestamp);
        smsList.pushMap(smsMap);
      }
      
      cursor.close();
      promise.resolve(smsList);
    } catch (Exception e) {
      promise.reject("ERROR", "Failed to read past SMS: " + e.getMessage());
    }
  }

"@

# Insert before the closing brace of the class
$content = $content -replace '(\s+)(private String getMessageFromMessageIntent)', "`$1$methodToAdd`n`$1`$2"

Set-Content $file -Value $content -NoNewline
Write-Host "Added readPastSMS method to SMS library." -ForegroundColor Green
Write-Host "Run .\scripts\BUILD_RELEASE_APK.ps1 to rebuild with past SMS reading support." -ForegroundColor Cyan
