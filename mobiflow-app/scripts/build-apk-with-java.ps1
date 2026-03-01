# Set JAVA_HOME and build release APK. Run from project root: .\scripts\build-apk-with-java.ps1
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17.0.18"
$ErrorActionPreference = "Stop"

Write-Host "JAVA_HOME set to: $env:JAVA_HOME" -ForegroundColor Cyan
& "$env:JAVA_HOME\bin\java.exe" -version

Write-Host "`nCleaning caches..." -ForegroundColor Yellow
Remove-Item -Recurse -Force "node_modules\.cache" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".expo" -ErrorAction SilentlyContinue

Write-Host "Cleaning Gradle..." -ForegroundColor Yellow
Push-Location android
& ".\gradlew.bat" clean
Remove-Item -Recurse -Force "app\build" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force ".gradle" -ErrorAction SilentlyContinue
Pop-Location

Write-Host "`nInstalling dependencies..." -ForegroundColor Yellow
npm install

Write-Host "`nBuilding release APK..." -ForegroundColor Yellow
npx expo run:android --variant release

Write-Host "`nDone. APK: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor Green
