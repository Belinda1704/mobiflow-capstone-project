# Build APK from short path with caches cleared.
# Run from project root, or set $SourceDir to your current project path.
# Usage: .\scripts\build-apk.ps1
# Or:    .\scripts\build-apk.ps1 -CopyToShortPath $false   (build in place, no copy)

param(
    [string]$ShortPath = "C:\mobiflow-app",
    [bool]$CopyToShortPath = $true,
    [string]$SourceDir = $PSScriptRoot + "\.."
)

$ErrorActionPreference = "Stop"

# Resolve source (run from repo root or from scripts/)
if (-not (Test-Path (Join-Path $SourceDir "package.json"))) {
    $SourceDir = $PSScriptRoot + "\.."
}
if (-not (Test-Path (Join-Path $SourceDir "package.json"))) {
    Write-Error "package.json not found. Run from project root or scripts folder."
}

$workDir = $SourceDir
if ($CopyToShortPath) {
    Write-Host "Copying project to short path: $ShortPath" -ForegroundColor Cyan
    if (Test-Path $ShortPath) {
        Remove-Item -Recurse -Force $ShortPath
    }
    New-Item -ItemType Directory -Path $ShortPath -Force | Out-Null
    # Exclude node_modules and android build outputs to speed up copy
    robocopy $SourceDir $ShortPath /E /XD node_modules ".expo" "android\app\build" "android\.gradle" ".git" /NFL /NDL /NJH /NJS
    if ($LASTEXITCODE -ge 8) { exit $LASTEXITCODE }
    $workDir = $ShortPath
}

Set-Location $workDir
Write-Host "Working directory: $workDir" -ForegroundColor Cyan

# 1) Clear caches
Write-Host "`n1. Clearing caches..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") { Remove-Item -Recurse -Force "node_modules\.cache" }
if (Test-Path "$env:LOCALAPPDATA\Temp\metro-*") { Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\metro-*" -ErrorAction SilentlyContinue }
if (Test-Path "$env:LOCALAPPDATA\Temp\haste-map-*") { Remove-Item -Recurse -Force "$env:LOCALAPPDATA\Temp\haste-map-*" -ErrorAction SilentlyContinue }
if (Test-Path ".expo") { Remove-Item -Recurse -Force ".expo" }
npx expo start --clear 2>$null; Start-Sleep -Seconds 2; Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue
Write-Host "   Metro/Expo caches cleared." -ForegroundColor Green

# 2) Clean Gradle (if android folder exists)
if (Test-Path "android") {
    Write-Host "`n2. Cleaning Gradle..." -ForegroundColor Yellow
    Set-Location android
    .\gradlew.bat clean 2>$null
    if (Test-Path "app\build") { Remove-Item -Recurse -Force "app\build" }
    if (Test-Path ".gradle") { Remove-Item -Recurse -Force ".gradle" }
    Set-Location ..
    Write-Host "   Gradle cleaned." -ForegroundColor Green
}

# 3) Fresh install
Write-Host "`n3. Installing dependencies (fresh)..." -ForegroundColor Yellow
if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
npm install
if ($LASTEXITCODE -ne 0) { Write-Error "npm install failed." }
Write-Host "   Dependencies installed (postinstall applied SMS overrides)." -ForegroundColor Green

# 4) Build release APK
Write-Host "`n4. Building release APK..." -ForegroundColor Yellow
npx expo run:android --variant release
if ($LASTEXITCODE -ne 0) { Write-Error "Build failed." }

$apkPath = "android\app\build\outputs\apk\release\app-release.apk"
if (Test-Path $apkPath) {
    Write-Host "`nDone. APK: $workDir\$apkPath" -ForegroundColor Green
    if ($CopyToShortPath) {
        $destApk = Join-Path $SourceDir "mobiflow-app-release.apk"
        Copy-Item $apkPath $destApk -Force
        Write-Host "Copied to: $destApk" -ForegroundColor Green
    }
} else {
    Write-Host "`nBuild finished; APK not found at expected path. Check android\app\build\outputs\apk\release\" -ForegroundColor Yellow
}
