# Patch SMS library for Android build (fix Build + getApplicationInfo)
# Run from mobiflow-app folder: .\scripts\patch-sms-library.ps1
# Also copy this script to C:\mobiflow\mobiflow-app and run there after npm install.

$file = "node_modules\@maniac-tech\react-native-expo-read-sms\android\src\main\java\com\reactlibrary\RNExpoReadSmsModule.java"
if (-not (Test-Path $file)) {
    Write-Host "ERROR: File not found: $file" -ForegroundColor Red
    exit 1
}
$content = Get-Content $file -Raw
if ($content -match 'getApplicationInfo\(\)\.targetSdkVersion' -and $content -notmatch 'reactContext\.getApplicationInfo\(\)\.targetSdkVersion') {
    $content = $content -replace 'getApplicationInfo\(\)\.targetSdkVersion', 'reactContext.getApplicationInfo().targetSdkVersion'
    Set-Content $file -Value $content -NoNewline
    Write-Host "Patched: getApplicationInfo() -> reactContext.getApplicationInfo()" -ForegroundColor Green
} elseif ($content -match 'import android\.os\.Build') {
    Write-Host "SMS library already patched (reactContext.getApplicationInfo + Build import present)." -ForegroundColor Green
} else {
    Write-Host "Adding import android.os.Build if missing..." -ForegroundColor Yellow
    if ($content -notmatch 'import android\.os\.Build;') {
        $content = $content -replace '(import android\.content\.pm\.PackageManager;)', "`$1`nimport android.os.Build;"
        Set-Content $file -Value $content -NoNewline
        Write-Host "Added import android.os.Build" -ForegroundColor Green
    }
    $content = Get-Content $file -Raw
    $content = $content -replace 'getApplicationInfo\(\)\.targetSdkVersion', 'reactContext.getApplicationInfo().targetSdkVersion'
    Set-Content $file -Value $content -NoNewline
    Write-Host "Patched getApplicationInfo() -> reactContext.getApplicationInfo()" -ForegroundColor Green
}
Write-Host "Done. Run .\scripts\BUILD_WITH_JAVA17.ps1 to build." -ForegroundColor Cyan
