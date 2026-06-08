# Sabi Wok — Setup Script
# Run this from the project folder after filling in .env.local
# Right-click → Run with PowerShell  OR  run: powershell -ExecutionPolicy Bypass -File setup.ps1

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Sabi Wok — Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check .env.local is filled in
$env_content = Get-Content ".env.local" -Raw
if ($env_content -match "REPLACE") {
    Write-Host "WARNING: .env.local still has REPLACE placeholders." -ForegroundColor Yellow
    Write-Host "Fill in all values in .env.local before running setup." -ForegroundColor Yellow
    Write-Host "See START.md for instructions." -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne "y") { exit }
}

Write-Host "Step 1/3 — Installing packages..." -ForegroundColor Green
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Step 2/3 — Pushing database schema..." -ForegroundColor Green
npm run db:push
if ($LASTEXITCODE -ne 0) { Write-Host "db:push failed — check DATABASE_URL in .env.local" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "Step 3/3 — Seeding database..." -ForegroundColor Green
npm run db:seed
if ($LASTEXITCODE -ne 0) { Write-Host "Seed failed" -ForegroundColor Red; exit 1 }

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Setup complete! Starting dev server..." -ForegroundColor Green
Write-Host "  Open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

npm run dev
