# Run this with Cursor/VS Code CLOSED to avoid index.lock.
# Right-click -> Run with PowerShell, or: powershell -ExecutionPolicy Bypass -File push-clean.ps1

$ErrorActionPreference = "Stop"
$repoPath = "C:\Users\Administrator\Downloads\vizon-main\vizon-main"
$env:Path += ";C:\Program Files\Git\bin"

Set-Location $repoPath

Write-Host "Removing existing .git to clear lock..." -ForegroundColor Yellow
if (Test-Path .git) {
    Remove-Item -Recurse -Force .git
}

Write-Host "Initializing fresh repo and adding remote..." -ForegroundColor Cyan
git init
git remote add origin https://github.com/Pranshu115/vizon.git
git branch -M main

Write-Host "Staging all files..." -ForegroundColor Cyan
git add -A

Write-Host "Committing..." -ForegroundColor Cyan
git commit -m "Updates: Eicher 2059XP single listing, console fix, memory/watch fixes, seed scripts"

Write-Host "Pushing to origin main..." -ForegroundColor Cyan
git push -u origin main 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Push failed. If the remote already has commits, run:" -ForegroundColor Yellow
    Write-Host "  git push -u origin main --force" -ForegroundColor White
    Write-Host "(--force overwrites the remote with your local branch.)" -ForegroundColor Gray
} else {
    Write-Host "Done." -ForegroundColor Green
}
