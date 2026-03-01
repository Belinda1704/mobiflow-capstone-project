# Build Android app with Java 17 (avoids "restricted method" errors with Java 24)
# Run from mobiflow-app folder: .\scripts\BUILD_WITH_JAVA17.ps1

$possiblePaths = @(
    "C:\Program Files\Java\jdk-17.0.18",
    "C:\Program Files\Java\jdk-17*",
    "C:\Program Files\Java\jdk-17",
    "C:\Program Files\Amazon Corretto\jdk17*",
    "C:\Program Files\Eclipse Adoptium\jdk-17*",
    "C:\Program Files\Microsoft\jdk-17*"
)

$java17Home = $null
foreach ($p in $possiblePaths) {
    if ($p -match '\*') {
        $parent = Split-Path $p -Parent
        $pattern = Split-Path $p -Leaf
        if (Test-Path $parent) {
            $resolved = Get-ChildItem -Path $parent -Directory -Filter $pattern -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($resolved) { $java17Home = $resolved.FullName; break }
        }
    } else {
        if (Test-Path $p) { $java17Home = $p; break }
    }
}

if (-not $java17Home) {
    Write-Host "ERROR: Java 17 not found. Please install JDK 17 and run this script again." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install options:"
    Write-Host "  1. Amazon Corretto 17: https://docs.aws.amazon.com/corretto/latest/corretto-17-ug/downloads-list.html"
    Write-Host "  2. Oracle JDK 17: https://www.oracle.com/java/technologies/downloads/#java17"
    Write-Host ""
    Write-Host "Default install path is usually: C:\Program Files\Java\jdk-17 or C:\Program Files\Amazon Corretto\jdk17.x.x_x"
    exit 1
}

Write-Host "Using Java 17 at: $java17Home" -ForegroundColor Green
$env:JAVA_HOME = $java17Home
$env:PATH = "$java17Home\bin;$env:PATH"
$env:ANDROID_HOME = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { "C:\Users\HP\AppData\Local\Android\Sdk" }
$env:PATH = "$env:ANDROID_HOME\platform-tools;$env:PATH"

Write-Host "Building app (connected device only, no emulator)..." -ForegroundColor Cyan
npx expo run:android --device
