# FastOrder Mobile Build Script (PowerShell)
# Automates Capacitor sync, icon sync, and builds signed Release APK + AAB

$ErrorActionPreference = "Stop"

$workspaceRoot = (Get-Item $PSScriptRoot).Parent.FullName
$mobileDir = "$workspaceRoot\apps\mobile"
$androidDir = "$mobileDir\android"
$outputDir = "$workspaceRoot\release_builds"

# Setup Environment
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    if (Test-Path "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot") {
        $env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.12.101-hotspot"
    } elseif (Test-Path "C:\Users\jomo4\.jdks\jbr-21.0.11") {
        $env:JAVA_HOME = "C:\Users\jomo4\.jdks\jbr-21.0.11"
    } elseif (Get-Command java -ErrorAction SilentlyContinue) {
        $javaCmd = (Get-Command java).Source
        $env:JAVA_HOME = Split-Path (Split-Path $javaCmd -Parent) -Parent
    }
}
if (-not $env:ANDROID_HOME -or -not (Test-Path $env:ANDROID_HOME)) {
    if (Test-Path "C:\Android\Sdk") {
        $env:ANDROID_HOME = "C:\Android\Sdk"
    } elseif (Test-Path "$env:LOCALAPPDATA\Android\Sdk") {
        $env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
    } elseif (Test-Path "C:\Users\jomo4\AppData\Local\Android\Sdk") {
        $env:ANDROID_HOME = "C:\Users\jomo4\AppData\Local\Android\Sdk"
    }
}
if ($env:ANDROID_HOME) {
    $env:ANDROID_SDK_ROOT = $env:ANDROID_HOME
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "  FastOrder Mobile Build Automation (Capacitor)" -ForegroundColor Yellow
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Java Version:" -ForegroundColor Gray
& "$env:JAVA_HOME\bin\java.exe" -version

# Step 1: Sync Capacitor
Write-Host "`n[1/3] Syncing Capacitor Android assets..." -ForegroundColor Green
Set-Location $mobileDir
npx cap sync android

# Step 2: Build with Gradle
Write-Host "`n[2/3] Building Release APK and AAB with Gradle..." -ForegroundColor Green
Set-Location $androidDir
.\gradlew.bat assembleRelease bundleRelease

# Step 3: Copy to release_builds
Write-Host "`n[3/3] Exporting artifacts to $outputDir..." -ForegroundColor Green
if (!(Test-Path $outputDir)) { New-Item -ItemType Directory -Path $outputDir -Force | Out-Null }

$apkSource = "$androidDir\app\build\outputs\apk\release\app-release.apk"
$aabSource = "$androidDir\app\build\outputs\bundle\release\app-release.aab"

if (Test-Path $apkSource) {
    Copy-Item $apkSource "$outputDir\FastOrder-release.apk" -Force
    $apkSize = [math]::Round((Get-Item "$outputDir\FastOrder-release.apk").Length / 1MB, 2)
    Write-Host "  [+] Release APK: $outputDir\FastOrder-release.apk ($apkSize MB)" -ForegroundColor Green
}

if (Test-Path $aabSource) {
    Copy-Item $aabSource "$outputDir\FastOrder-release.aab" -Force
    $aabSize = [math]::Round((Get-Item "$outputDir\FastOrder-release.aab").Length / 1MB, 2)
    Write-Host "  [+] Google Play Bundle: $outputDir\FastOrder-release.aab ($aabSize MB)" -ForegroundColor Green
}

Write-Host "`nBuild Completed Successfully! All files ready in release_builds\" -ForegroundColor Cyan
