# Crop Disease Detector — one-command start (Windows PowerShell).
#
#   .\start.ps1            build the website once and run everything at http://localhost:8000
#   .\start.ps1 -Rebuild   rebuild the website first (after changing frontend code)
#   .\start.ps1 -Dev       development mode: backend on :8000 + live-reloading frontend on :5173
#
param([switch]$Rebuild, [switch]$Dev)
$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$py = Join-Path $root "backend\.venv\Scripts\python.exe"

if (-not (Test-Path $py)) {
    Write-Host "Setting up Python environment (first run only)..." -ForegroundColor Green
    python -m venv (Join-Path $root "backend\.venv")
    & $py -m pip install --quiet --upgrade pip
    & $py -m pip install --quiet -r (Join-Path $root "backend\requirements.txt")
}
if (-not (Test-Path (Join-Path $root "frontend\node_modules"))) {
    Write-Host "Installing website packages (first run only)..." -ForegroundColor Green
    Push-Location (Join-Path $root "frontend"); npm install; Pop-Location
}

if ($Dev) {
    Write-Host "Starting backend on http://localhost:8000 in a new window..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$root\backend'; & '$py' -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"
    Write-Host "Starting website on http://localhost:5173 ..." -ForegroundColor Green
    Set-Location (Join-Path $root "frontend"); npm run dev
    return
}

if ($Rebuild -or -not (Test-Path (Join-Path $root "frontend\dist\index.html"))) {
    Write-Host "Building the website..." -ForegroundColor Green
    Push-Location (Join-Path $root "frontend"); npm run build; Pop-Location
}
Set-Location (Join-Path $root "backend")
Write-Host "`nCrop Disease Detector is running:  http://localhost:8000   (API docs: http://localhost:8000/docs)`n" -ForegroundColor Green
& $py -m uvicorn app.main:app --host 127.0.0.1 --port 8000
