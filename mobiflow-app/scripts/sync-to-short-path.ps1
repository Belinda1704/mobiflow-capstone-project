# Sync build fixes from this project to C:\mobiflow\mobiflow-app. Run from project root.
$dst = "C:\mobiflow\mobiflow-app"
$src = $PSScriptRoot + "\.."
if (-not (Test-Path $dst)) { Write-Error "Destination not found: $dst"; exit 1 }

# Build script with JAVA_HOME + ANDROID_HOME
Copy-Item (Join-Path $src "scripts\BUILD_RELEASE_APK.ps1") -Destination (Join-Path $dst "BUILD_RELEASE_APK.ps1") -Force
# Postinstall uses overrides, not patch-package
$pkg = Join-Path $dst "package.json"
(Get-Content $pkg -Raw) -replace '"postinstall":\s*"patch-package"', '"postinstall": "node scripts/apply-sms-overrides.js"' | Set-Content $pkg -NoNewline
# Remove broken patch so npm install won't run patch-package
$patch = Join-Path $dst "patches\@maniac-tech+react-native-expo-read-sms+9.0.2-alpha.patch"
if (Test-Path $patch) { Remove-Item $patch -Force }
# Overrides script and files
$dstScripts = Join-Path $dst "scripts"
$dstPatches = Join-Path $dst "patches\sms-package-overrides"
New-Item -ItemType Directory -Path $dstScripts -Force | Out-Null
New-Item -ItemType Directory -Path $dstPatches -Force | Out-Null
Copy-Item (Join-Path $src "scripts\apply-sms-overrides.js") -Destination (Join-Path $dstScripts "apply-sms-overrides.js") -Force
Copy-Item (Join-Path $src "patches\sms-package-overrides\index.js") -Destination (Join-Path $dstPatches "index.js") -Force
Copy-Item (Join-Path $src "patches\sms-package-overrides\RNExpoReadSmsModule.java") -Destination (Join-Path $dstPatches "RNExpoReadSmsModule.java") -Force
Write-Host "Synced to $dst. You can run: cd $dst; .\BUILD_RELEASE_APK.ps1" -ForegroundColor Green
