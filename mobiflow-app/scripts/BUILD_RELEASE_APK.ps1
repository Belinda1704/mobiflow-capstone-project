# Build release APK. From main project: .\scripts\BUILD_RELEASE_APK.ps1
# From short path (C:\mobiflow\mobiflow-app): .\BUILD_RELEASE_APK.ps1
# Optional: -Clean   to force full clean (slower, use if build is broken)

param([switch]$Clean)

$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.18"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
if (-not (Test-Path $env:ANDROID_HOME)) { $env:ANDROID_HOME = "C:\Users\HP\AppData\Local\Android\Sdk" }
$ErrorActionPreference = "Stop"

Write-Host "JAVA_HOME = $env:JAVA_HOME" -ForegroundColor Cyan
Write-Host "ANDROID_HOME = $env:ANDROID_HOME" -ForegroundColor Cyan
& "$env:JAVA_HOME\bin\java.exe" -version

# Force minSdk 34 for SMS library (Gradle overrides manifest, so we must patch Gradle)
foreach ($gradleApp in @("android\app\build.gradle.kts", "android\app\build.gradle")) {
    if (Test-Path $gradleApp) {
        $content = Get-Content $gradleApp -Raw
        $orig = $content
        $content = $content -replace 'minSdk\s*=\s*24\b', 'minSdk = 34'
        $content = $content -replace 'minSdkVersion\(\s*24\s*\)', 'minSdkVersion(34)'
        $content = $content -replace 'minSdkVersion\s+24\b', 'minSdkVersion 34'
        $content = $content -replace 'minSdkVersion\s+rootProject\.ext\.minSdkVersion', 'minSdkVersion 34'
        $content = $content -replace 'minSdk\s+rootProject\.ext\.minSdkVersion', 'minSdk = 34'
        if ($content -ne $orig) {
            Set-Content $gradleApp -Value $content -NoNewline
            Write-Host "`nSet Android minSdk to 34 in $gradleApp (SMS library requirement)." -ForegroundColor Gray
        }
        break
    }
}
foreach ($gradleRoot in @("android\build.gradle.kts", "android\build.gradle")) {
    if (Test-Path $gradleRoot) {
        $content = Get-Content $gradleRoot -Raw
        $orig = $content
        $content = $content -replace 'ext\.minSdkVersion\s*=\s*24\b', 'ext.minSdkVersion = 34'
        $content = $content -replace 'minSdkVersion\s*=\s*24\b', 'minSdkVersion = 34'
        $content = $content -replace 'minSdk\s*=\s*24\b', 'minSdk = 34'
        if ($content -ne $orig) {
            Set-Content $gradleRoot -Value $content -NoNewline
            Write-Host "Set Android minSdk to 34 in $gradleRoot." -ForegroundColor Gray
        }
        break
    }
}
$gp = "android\gradle.properties"
if (Test-Path $gp) {
    $c = Get-Content $gp -Raw
    if ($c -match 'minSdkVersion\s*=\s*24\b') {
        $c = $c -replace 'minSdkVersion\s*=\s*24\b', 'minSdkVersion=34'
        Set-Content $gp -Value $c -NoNewline
        Write-Host "Set Android minSdk to 34 in gradle.properties." -ForegroundColor Gray
    }
}
# Manifest patch (Gradle overrides it, but keep for consistency)
$manifestPath = "android\app\src\main\AndroidManifest.xml"
if (Test-Path $manifestPath) {
    $xml = Get-Content $manifestPath -Raw
    if ($xml -match 'uses-sdk') {
        $xml = $xml -replace 'android:minSdkVersion="\d+"', 'android:minSdkVersion="34"'
    } else {
        $xml = $xml -replace '(<manifest[^>]*>)', "`$1`n  <uses-sdk android:minSdkVersion=`"34`" />"
    }
    Set-Content $manifestPath -Value $xml -NoNewline
    Write-Host "Set Android minSdk to 34 in AndroidManifest.xml." -ForegroundColor Gray
}

Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue

if ($Clean) {
    Write-Host "`nFull clean (Gradle + native caches)..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force "android\app\build" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "android\.gradle" -ErrorAction SilentlyContinue
    Remove-Item -Recurse -Force "android\app\.cxx" -ErrorAction SilentlyContinue
} else {
    Write-Host "`nIncremental build (skip Gradle clean for speed). Use -Clean if build is broken." -ForegroundColor Gray
}

Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`nBuilding release APK..." -ForegroundColor Yellow
$gradlew = "android\gradlew.bat"
if (-not (Test-Path $gradlew)) {
    Write-Host "ERROR: $gradlew not found. The Android project was not generated." -ForegroundColor Red
    Write-Host "Run this first (from this folder, C:\mobiflow\mobiflow-app):" -ForegroundColor Yellow
    Write-Host "  npx expo prebuild --platform android --clean" -ForegroundColor Cyan
    Write-Host "Then run this script again. If you sync from source, run .\scripts\SETUP_SHORT_PATH.ps1 from your main project first." -ForegroundColor Gray
    exit 1
}
Push-Location android
.\gradlew.bat assembleRelease
$buildOk = ($LASTEXITCODE -eq 0)
Pop-Location
if (-not $buildOk) {
    Write-Host "Build failed." -ForegroundColor Red
    exit 1
}

$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
Write-Host "`nDone. APK: $apkPath" -ForegroundColor Green
if (Test-Path $apkPath) {
    $fullPath = (Resolve-Path $apkPath).Path
    Write-Host "Full path: $fullPath" -ForegroundColor Gray
    Write-Host "Copy this file to your phone and tap to install (no laptop needed after that)." -ForegroundColor Cyan
    $adb = "$env:ANDROID_HOME\platform-tools\adb.exe"
    $devices = cmd /c "`"$adb`" devices 2>nul"
    if ($devices -match "device\s*$") {
        Write-Host "`nInstalling to connected device..." -ForegroundColor Yellow
        cmd /c "`"$adb`" install -r `"$apkPath`" 2>nul"
        if ($LASTEXITCODE -eq 0) { Write-Host "Installed on device." -ForegroundColor Green } else { Write-Host "Install failed (copy APK to phone manually)." -ForegroundColor Yellow }
    } else {
        Write-Host "No device connected. Connect phone (USB debugging on) and run this script again to install, or copy the APK to the phone." -ForegroundColor Yellow
    }
}
