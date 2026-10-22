# Rebuild and run the practice questions.
#   ./run.ps1               build your answers, run the question set in main.cpp
#   ./run.ps1 5             set kQuestion = 5 in main.cpp first (0 = all)
#   ./run.ps1 -Solutions    build the reference solutions instead (build_sol/)
param(
  [int]$Question = -1,
  [switch]$Solutions
)

Clear-Host  # start each run with a clean terminal

$env:Path = "C:\msys64\mingw64\bin;" + $env:Path
Set-Location $PSScriptRoot

if ($Question -ge 0) {
  (Get-Content main.cpp -Raw) -replace 'kQuestion = \d+', "kQuestion = $Question" |
    Set-Content main.cpp -NoNewline
}

$dir = if ($Solutions) { "build_sol" } else { "build" }
$on = if ($Solutions) { "ON" } else { "OFF" }

# Always re-run configure so new question files are picked up.
cmake -S . -B $dir -G Ninja "-DUSE_SOLUTIONS=$on"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
cmake --build $dir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

& "./$dir/practice.exe"
$code = $LASTEXITCODE
if ($code -lt 0 -or $code -gt 255) {
  Write-Host "`nProgram crashed (exit code $code)" -ForegroundColor Red
} else {
  Write-Host "`nExit code: $code"
}
