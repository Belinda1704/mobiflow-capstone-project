# =============================================================================
# MobiFlow: One-click setup for Android build (short path, no copy errors)
# Run from mobiflow-app: .\scripts\SETUP_SHORT_PATH.ps1
#
# IMPORTANT: Run this AFTER making code changes so the short path
# (C:\mobiflow\mobiflow-app) gets a full copy, then run .\BUILD_RELEASE_APK.ps1
# from C:\mobiflow\mobiflow-app to build the APK.
#
# Optional: .\scripts\SETUP_SHORT_PATH.ps1 -PreserveCache
#   Syncs code but keeps Gradle cache (android\.gradle, android\app\build) in
#   the short path so the next build is incremental (~10 min instead of ~50 min).
# =============================================================================

param([switch]$PreserveCache)

$ErrorActionPreference = "Stop"
$Source = "C:\Users\HP\Desktop\Capstone development\mobiflow-capstone-project\mobiflow-app"
$DestRoot = "C:\mobiflow"
$DestApp = "C:\mobiflow\mobiflow-app"

Write-Host ""
Write-Host "MobiFlow Android build setup" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# 1. Check we're in the right place (script is in source project)
if (-not (Test-Path "$Source\package.json")) {
    Write-Host "ERROR: package.json not found at: $Source" -ForegroundColor Red
    Write-Host "Run this script from the mobiflow-app folder or fix the path inside the script." -ForegroundColor Red
    exit 1
}

# 2. Create C:\mobiflow
Write-Host "[1/6] Creating $DestRoot ..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $DestRoot -Force | Out-Null

# 3. Stop Gradle daemon (releases lock on build files) then remove old copy (unless -PreserveCache)
if (Test-Path $DestApp) {
    Write-Host "[2/6] Stopping Gradle daemon (releases file locks) ..." -ForegroundColor Yellow
    $gradlew = "$DestApp\android\gradlew.bat"
    if (Test-Path $gradlew) {
        cmd /c "`"$gradlew`" --stop 2>nul"
        Start-Sleep -Seconds 3
    }
    if ($PreserveCache) {
        Write-Host "      -PreserveCache: keeping existing folder and Gradle cache (next build will be faster)." -ForegroundColor Green
        $inPlaceSync = $true
        $removed = $false
    } else {
        # Kill any remaining Gradle Java daemons (they often keep .dex/.jar locks)
        Get-CimInstance Win32_Process -Filter "name='java.exe'" -ErrorAction SilentlyContinue | ForEach-Object {
            try {
                $cmd = $_.CommandLine
                if ($cmd -and ($cmd -like '*Gradle*' -or $cmd -like '*gradle*')) {
                    Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                    Write-Host "      Stopped Gradle Java process (PID $($_.ProcessId))." -ForegroundColor Gray
                }
            } catch { }
        }
        # Kill any process (Node, Java, etc.) that is using the destination folder (e.g. Metro, build from node_modules)
        foreach ($procName in @('node.exe', 'java.exe')) {
            Get-CimInstance Win32_Process -Filter "name='$procName'" -ErrorAction SilentlyContinue | ForEach-Object {
                try {
                    $cmd = $_.CommandLine
                    if ($cmd -and $cmd.Contains($DestApp)) {
                        Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
                        Write-Host "      Stopped $procName using folder (PID $($_.ProcessId))." -ForegroundColor Gray
                    }
                } catch { }
            }
        }
        Start-Sleep -Seconds 3
        Write-Host "      Removing old copy at $DestApp ..." -ForegroundColor Yellow
        $removed = $false
        foreach ($attempt in 1..3) {
            try {
                Remove-Item -Recurse -Force $DestApp -ErrorAction Stop
                $removed = $true
                break
            } catch {
                if ($attempt -lt 3) {
                    Write-Host "      Wait and retry ($attempt/3) ..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 3
                }
            }
        }
        if (-not $removed) {
            cmd /c "rd /s /q `"$DestApp`""
            $removed = -not (Test-Path $DestApp)
        }
        $inPlaceSync = -not $removed
        if (-not $removed) {
            Write-Host "      Folder in use - will sync in place (overwrite files without deleting folder)." -ForegroundColor Yellow
        }
    }
} else {
    $inPlaceSync = $false
}
if (-not (Test-Path $DestApp)) {
    New-Item -ItemType Directory -Path $DestApp -Force | Out-Null
}

# 4. Copy full project (mirror of main folder) except node_modules and build outputs
# With -PreserveCache we exclude .gradle and build so next build is incremental (~10 min).
Write-Host "[3/6] Copying full project to short path ..." -ForegroundColor Yellow
if ($inPlaceSync -and $PreserveCache) {
    # Sync code but keep Gradle cache in dest so next build is fast
    & robocopy $Source $DestApp /E /XD node_modules .cxx build .gradle /NFL /NDL /NJH /NJS /R:1 /W:1
    Write-Host "      (Preserving android\.gradle and android\app\build for faster next build.)" -ForegroundColor Gray
} elseif ($inPlaceSync) {
    & robocopy $Source $DestApp /MIR /XD node_modules .cxx build /NFL /NDL /NJH /NJS /R:1 /W:1
} else {
    & robocopy $Source $DestApp /E /XD node_modules .cxx build /NFL /NDL /NJH /NJS /R:1 /W:1
}
# Robocopy: 0=nothing to copy, 1=files copied, 2+ = more. 8+ = error
$rc = $LASTEXITCODE
if ($rc -ge 8) {
    Write-Host "ERROR: Robocopy failed with code $rc" -ForegroundColor Red
    exit 1
}
Write-Host "      Copy done." -ForegroundColor Green
if ($inPlaceSync -and -not $PreserveCache) {
    Write-Host "      Removing node_modules and build caches in short path for clean install ..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "$DestApp\node_modules" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$DestApp\android\app\build" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$DestApp\android\.gradle" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$DestApp\android\app\.cxx" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$DestApp\.expo" -ErrorAction SilentlyContinue
} elseif ($inPlaceSync -and $PreserveCache) {
    # Only remove node_modules so npm install runs; keep .gradle and build
    Remove-Item -Recurse -Force "$DestApp\node_modules" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "$DestApp\.expo" -ErrorAction SilentlyContinue
    Write-Host "      Kept Gradle cache; removed node_modules for npm install." -ForegroundColor Gray
}

# 5. npm install in new location
Write-Host "[4/6] Running npm install in $DestApp ..." -ForegroundColor Yellow
Push-Location $DestApp
try {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: npm install failed" -ForegroundColor Red
        exit 1
    }
} finally {
    Pop-Location
}
Write-Host "      npm install done." -ForegroundColor Green
Write-Host "      (npm audit reported issues are often in Expo/RN deps; run 'npm audit' in the app folder to review.)" -ForegroundColor Gray

# 6. Patch SMS library (Build + getApplicationInfo fix + readPastSMS method)
$smsJava = "$DestApp\node_modules\@maniac-tech\react-native-expo-read-sms\android\src\main\java\com\reactlibrary\RNExpoReadSmsModule.java"
Write-Host "[5/6] Patching SMS library for Android build ..." -ForegroundColor Yellow
if (Test-Path $smsJava) {
    $content = Get-Content $smsJava -Raw
    
    # Patch 1: Fix getApplicationInfo
    $needsPatch = $content -match 'getApplicationInfo\(\)\.targetSdkVersion' -and $content -notmatch 'reactContext\.getApplicationInfo\(\)\.targetSdkVersion'
    if ($needsPatch) {
        $content = $content -replace 'getApplicationInfo\(\)\.targetSdkVersion', 'reactContext.getApplicationInfo().targetSdkVersion'
        if ($content -notmatch 'import android\.os\.Build;') {
            $content = $content -replace '(import android\.content\.pm\.PackageManager;)', "`$1`nimport android.os.Build;"
        }
        Write-Host "      Fixed getApplicationInfo." -ForegroundColor Green
    }
    
    # Patch 2: Add readPastSMS method if not exists
    if ($content -notmatch '@ReactMethod.*readPastSMS') {
        # Add imports
        if ($content -notmatch 'import android\.content\.ContentResolver') {
            $content = $content -replace '(import android\.content\.IntentFilter;)', "`$1`nimport android.content.ContentResolver;`nimport android.database.Cursor;`nimport android.net.Uri;"
        }
        if ($content -notmatch 'import com\.facebook\.react\.bridge\.Promise') {
            $content = $content -replace '(import com\.facebook\.react\.bridge\.Callback;)', "`$1`nimport com.facebook.react.bridge.Promise;`nimport com.facebook.react.bridge.WritableArray;`nimport com.facebook.react.bridge.Arguments;`nimport com.facebook.react.bridge.WritableMap;"
        }
        
        # Add method
        $methodToAdd = @"

  @ReactMethod
  public void readPastSMS(int limit, Promise promise) {
    try {
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
        $content = $content -replace '(\s+)(private String getMessageFromMessageIntent)', "`$1$methodToAdd`n`$1`$2"
        Write-Host "      Added readPastSMS method." -ForegroundColor Green
    } else {
        Write-Host "      readPastSMS method already exists." -ForegroundColor Green
    }
    
    Set-Content $smsJava -Value $content -NoNewline
    Write-Host "      SMS library patched successfully." -ForegroundColor Green
} else {
    Write-Host "      WARNING: SMS library file not found (patch skipped)." -ForegroundColor Yellow
}

# 6b. Audit: verify everything from main project is in short path (critical paths only)
$auditPaths = @(
    "app.json", "package.json", "app.config.js", "package-lock.json",
    "declarations.d.ts", "expo-env.d.ts", "jest.config.js", "jest-setup.js",
    ".env", ".gitignore", ".npmrc",
    "app\_layout.tsx", "app\index.tsx", "app\(tabs)\index.tsx",
    "assets\images\app-icon.png", "assets\images\splash-icon.png", "assets\images\favicon.png",
    "components", "hooks", "utils", "services", "constants", "config", "contexts", "types", "i18n", "locales",
    "scripts\apply-sms-overrides.js", "patches", "__tests__", "docs",
    "BUILD_RELEASE_APK.ps1", "SETUP_SHORT_PATH.ps1", "BUILD_WITH_JAVA17.ps1"
)
$missing = @()
foreach ($p in $auditPaths) {
    if (-not (Test-Path "$DestApp\$p")) { $missing += $p }
}
if ($missing.Count -gt 0) {
    Write-Host "      AUDIT: Missing in short path (copy may be incomplete):" -ForegroundColor Red
    $missing | ForEach-Object { Write-Host "        - $_" -ForegroundColor Red }
} else {
    Write-Host "      Audit OK: all critical paths from main project are present in short path." -ForegroundColor Green
}
# Asset checks for APK
$iconPath = "$DestApp\assets\images\app-icon.png"
$splashPath = "$DestApp\assets\images\splash-icon.png"
if (Test-Path $iconPath) { Write-Host "      app-icon.png present (APK launcher icon)." -ForegroundColor Green } else { Write-Host "      WARNING: app-icon.png missing - APK will use default icon." -ForegroundColor Yellow }
if (Test-Path $splashPath) { Write-Host "      splash-icon.png present (splash screen; name matches app.json)." -ForegroundColor Green } else { Write-Host "      WARNING: splash-icon.png missing - APK will use default splash." -ForegroundColor Yellow }

# 6c. Regenerate Android native project so app name = MobiFlow and icon/splash from assets
Write-Host "[5b/6] Regenerating Android (MobiFlow name + your icon/splash) ..." -ForegroundColor Yellow
Push-Location $DestApp
try {
    "Y" | npx expo prebuild --clean --platform android
    if ($LASTEXITCODE -ne 0) {
        Write-Host "      WARNING: prebuild failed - APK may keep old icon/name. Continuing." -ForegroundColor Yellow
    } else {
        Write-Host "      Android regenerated (MobiFlow, icon, splash)." -ForegroundColor Green
    }
} finally {
    Pop-Location
}

# 7. Ensure build/setup scripts in short path are latest (copy from scripts folder)
foreach ($script in @("BUILD_WITH_JAVA17.ps1", "BUILD_RELEASE_APK.ps1", "SETUP_SHORT_PATH.ps1")) {
    $srcPath = "$Source\scripts\$script"
    if (Test-Path $srcPath) {
        Copy-Item $srcPath "$DestApp\$script" -Force
        Write-Host "      $script copied (latest from main project)." -ForegroundColor Green
    }
}

Write-Host "[6/6] Setup complete." -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Connect your Android phone (USB debugging on)." -ForegroundColor White
Write-Host "  2. Open PowerShell and run:" -ForegroundColor White
Write-Host ""
Write-Host "     cd C:\mobiflow\mobiflow-app" -ForegroundColor Yellow
Write-Host "     .\BUILD_RELEASE_APK.ps1" -ForegroundColor Yellow
Write-Host ""
Write-Host "  -> Use BUILD_RELEASE_APK.ps1 for STANDALONE app (no laptop needed after install)." -ForegroundColor Green
Write-Host "  -> Use BUILD_WITH_JAVA17.ps1 only for debug (Metro + laptop)." -ForegroundColor Gray
Write-Host ""
