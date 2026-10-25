# Starts the local server (real MinGW g++ as the runner) and opens the app.
#   ./start.ps1             install and build if needed, then start
#   ./start.ps1 -Rebuild    rebuild the app first (after changing app/src)
param([switch]$Rebuild)

Set-Location $PSScriptRoot
$env:Path = "C:\msys64\mingw64\bin;" + $env:Path

if (-not (Test-Path node_modules)) { npm install; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }
if ($Rebuild -or -not (Test-Path dist\index.html)) { npm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE } }

Start-Process "http://localhost:5270"
node server/server.js
