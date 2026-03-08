# Supabase Environment Setup Script (Windows PowerShell)
# This script helps you set up your .env.local file with Supabase credentials

Write-Host "Supabase Environment Setup" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local already exists
if (Test-Path ".env.local") {
    Write-Host "WARNING: .env.local already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Cancelled. Your existing .env.local was not modified." -ForegroundColor Red
        exit 0
    }
}

# Get Supabase URL
Write-Host "Enter your Supabase Project URL:" -ForegroundColor Green
Write-Host "   (Looks like: https://xxxxxxxxxxxxx.supabase.co)"
$SUPABASE_URL = Read-Host "Project URL"

# Get Supabase Anon Key
Write-Host ""
Write-Host "Enter your Supabase anon public key:" -ForegroundColor Green
Write-Host "   (Long string starting with eyJ...)"
$SUPABASE_ANON_KEY = Read-Host "Anon Key"

# Validate inputs
if ([string]::IsNullOrEmpty($SUPABASE_URL) -or [string]::IsNullOrEmpty($SUPABASE_ANON_KEY)) {
    Write-Host "Error: Both URL and Key are required!" -ForegroundColor Red
    exit 1
}

# Create .env.local file
$envContent = @"
# Supabase Configuration
# Generated automatically - $(Get-Date)

NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Alternative variable names (optional)
# SUPABASE_URL=$SUPABASE_URL
# SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
"@

$envContent | Out-File -FilePath ".env.local" -Encoding utf8

Write-Host ""
Write-Host "Success! Created .env.local file with your Supabase credentials" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Restart your development server if it's running"
Write-Host "   2. Test the connection by running: npm run dev"
Write-Host ""
