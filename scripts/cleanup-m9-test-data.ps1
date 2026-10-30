<#
.SYNOPSIS
    Cleans up temporary Milestone 9 test component listings from CoreHub.

.DESCRIPTION
    Safely deletes test components created with the '[M9 TEST]' prefix.
    Incorporates strict safeguards:
      - NEVER deletes component ID 1 (protected baseline listing).
      - NEVER deletes components without the '[M9 TEST]' prefix.
      - Gracefully catches HTTP 409 Conflict if a test component has reservation history,
        preserving it to protect reservation audit records.
      - Supports '-DryRun' mode to inspect deletion targets before making changes.

.PARAMETER BaseUrl
    Base URL of the CoreHub backend server. Default is 'http://localhost:8080'.

.PARAMETER Token
    Optional existing JWT access token. If omitted, prompts for credentials to log in dynamically.

.PARAMETER Email
    Optional student email for login. If omitted and Token is not provided, prompts interactively.

.PARAMETER Password
    Optional student password for login. If omitted and Token is not provided, prompts securely.

.PARAMETER DryRun
    When specified, inspects candidate test listings and displays what would be deleted
    without sending any DELETE requests to the server.

.EXAMPLE
    # Preview deletions without deleting anything
    .\scripts\cleanup-m9-test-data.ps1 -DryRun

.EXAMPLE
    # Safely delete test components interactively
    .\scripts\cleanup-m9-test-data.ps1
#>

[CmdletBinding()]
param(
    [string]$BaseUrl = "http://localhost:8080",
    [string]$Token = "",
    [string]$Email = "",
    [string]$Password = "",
    [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# Ensure TLS 1.2 is enabled
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host " CoreHub Milestone 9 Test Data Cleanup Script" -ForegroundColor Yellow
Write-Host "==========================================================" -ForegroundColor Yellow
Write-Host "Backend URL : $BaseUrl"
Write-Host "Mode        : $(if ($DryRun) { '[DRY RUN] Preview only - no listings will be deleted' } else { 'LIVE CLEANUP' })"
Write-Host ""

# 1. Health Check
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Backend server reachable: Status '$($health.status)'" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not connect to CoreHub backend at $BaseUrl" -ForegroundColor Red
    Write-Host "Please ensure the Spring Boot backend is running before cleaning up test data." -ForegroundColor Yellow
    exit 1
}

# 2. Dynamic Authentication
$jwtToken = $Token
if ([string]::IsNullOrWhiteSpace($jwtToken)) {
    if ([string]::IsNullOrWhiteSpace($Email)) {
        $Email = Read-Host "Enter student email for authentication"
    }
    if ([string]::IsNullOrWhiteSpace($Password)) {
        $secPass = Read-Host "Enter student password" -AsSecureString
        $bstr = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($secPass)
        $Password = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($bstr)
        [System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }

    Write-Host "Authenticating as $Email..." -NoNewline
    $loginBody = @{
        email    = $Email
        password = $Password
    } | ConvertTo-Json

    try {
        $loginResp = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" `
            -Method Post `
            -Body ([System.Text.Encoding]::UTF8.GetBytes($loginBody)) `
            -ContentType "application/json; charset=utf-8" `
            -ErrorAction Stop

        $jwtToken = $loginResp.accessToken
        Write-Host " [SUCCESS]" -ForegroundColor Green
        Write-Host "Logged in as : $($loginResp.user.name) (ID: $($loginResp.user.id))" -ForegroundColor Gray
    } catch [System.Net.WebException] {
        Write-Host " [FAILED]" -ForegroundColor Red
        $webResp = $_.Exception.Response
        if ($webResp) {
            $reader = New-Object System.IO.StreamReader($webResp.GetResponseStream())
            $errBody = $reader.ReadToEnd()
            $reader.Close()
            Write-Host "Authentication failed: $errBody" -ForegroundColor Red
        } else {
            Write-Host "Authentication failed: $($_.Exception.Message)" -ForegroundColor Red
        }
        exit 1
    }
}

$authHeaders = @{
    "Authorization" = "Bearer $jwtToken"
}

# 3. Locate Candidates for Deletion
$candidates = @{}
$trackingFilePath = Join-Path -Path $PSScriptRoot -ChildPath "m9-test-components.json"

# Check tracking file
if (Test-Path $trackingFilePath) {
    try {
        $tracked = Get-Content -Path $trackingFilePath -Raw | ConvertFrom-Json
        foreach ($t in $tracked) {
            $candidates[$t.id] = [PSCustomObject]@{
                id          = [long]$t.id
                title       = $t.title
                category    = $t.category
                source      = "tracking-file"
            }
        }
        Write-Host "[INFO] Loaded $($candidates.Count) candidate listings from '$trackingFilePath'" -ForegroundColor Gray
    } catch {
        Write-Host "[WARNING] Could not parse tracking file: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# Also query live /api/components/mine to discover any untracked [M9 TEST] listings owned by this user
try {
    $myComponents = Invoke-RestMethod -Uri "$BaseUrl/api/components/mine" -Method Get -Headers $authHeaders -ErrorAction Stop
    if ($myComponents) {
        foreach ($c in $myComponents) {
            if ($c.title -and $c.title.StartsWith("[M9 TEST]")) {
                if (-not $candidates.ContainsKey($c.id)) {
                    $candidates[$c.id] = [PSCustomObject]@{
                        id          = [long]$c.id
                        title       = $c.title
                        category    = $c.category
                        source      = "api-mine"
                    }
                }
            }
        }
    }
} catch {
    Write-Host "[WARNING] Could not query user listings: $($_.Exception.Message)" -ForegroundColor Yellow
}

if ($candidates.Count -eq 0) {
    Write-Host "`nNo [M9 TEST] components found to clean up. Database is already clean." -ForegroundColor Green
    if (Test-Path $trackingFilePath) {
        Remove-Item -Path $trackingFilePath -Force -ErrorAction SilentlyContinue
    }
    exit 0
}

Write-Host "`nIdentified $($candidates.Count) test candidate(s) for cleanup." -ForegroundColor Cyan
Write-Host "----------------------------------------------------------" -ForegroundColor Gray

# 4. Process Deletions with Strict Safety Checks
$deletedCount = 0
$preservedCount = 0
$remainingTracked = @()

foreach ($cand in $candidates.Values) {
    $id = $cand.id
    $title = $cand.title

    # SAFEGUARD 1: Never delete component ID 1
    if ($id -eq 1) {
        Write-Host ("[SAFEGUARD] Component ID 1 ('{0}') is protected and will NEVER be deleted." -f $title) -ForegroundColor Yellow
        $preservedCount++
        continue
    }

    # SAFEGUARD 2: Title must start with [M9 TEST]
    if (-not $title.StartsWith("[M9 TEST]")) {
        Write-Host ("[SAFEGUARD] Component ID {0} ('{1}') does not start with '[M9 TEST]'. Skipping." -f $id, $title) -ForegroundColor Yellow
        $preservedCount++
        continue
    }

    if ($DryRun) {
        Write-Host ("[DRY RUN - WOULD DELETE] Component ID: {0} | '{1}' ({2})" -f $id, $title, $cand.category) -ForegroundColor Yellow
        $deletedCount++
    } else {
        try {
            # Send DELETE /api/components/{id}
            $deleteResp = Invoke-WebRequest -Uri "$BaseUrl/api/components/$id" `
                -Method Delete `
                -Headers $authHeaders `
                -UseBasicParsing `
                -ErrorAction Stop

            if ($deleteResp.StatusCode -eq 204 -or $deleteResp.StatusCode -eq 200) {
                Write-Host ("[DELETED] Component ID: {0} | '{1}'" -f $id, $title) -ForegroundColor Green
                $deletedCount++
            } else {
                Write-Host ("[WARNING] Unexpected response ({0}) deleting component ID {1}" -f $deleteResp.StatusCode, $id) -ForegroundColor Yellow
                $remainingTracked += $cand
            }
        } catch [System.Net.WebException] {
            $webResp = $_.Exception.Response
            if ($webResp -and [int]$webResp.StatusCode -eq 409) {
                # HTTP 409 Conflict: reservation exists (active or historical)
                $reader = New-Object System.IO.StreamReader($webResp.GetResponseStream())
                $conflictMsg = $reader.ReadToEnd()
                $reader.Close()
                Write-Host ("[PRESERVED] Component ID {0} has reservation history (HTTP 409 Conflict). Preserved to protect audit integrity: {1}" -f $id, $conflictMsg) -ForegroundColor Cyan
                $preservedCount++
                $remainingTracked += $cand
            } elseif ($webResp -and [int]$webResp.StatusCode -eq 404) {
                Write-Host ("[ALREADY REMOVED] Component ID {0} not found on server." -f $id) -ForegroundColor Gray
                $deletedCount++
            } else {
                Write-Host ("[ERROR] Failed to delete component ID {0}: $($_.Exception.Message)" -f $id) -ForegroundColor Red
                $remainingTracked += $cand
            }
        } catch {
            Write-Host ("[ERROR] Failed to delete component ID {0}: $($_.Exception.Message)" -f $id) -ForegroundColor Red
            $remainingTracked += $cand
        }
    }
}

# 5. Update or Remove Tracking File
if (-not $DryRun) {
    if ($remainingTracked.Count -gt 0) {
        $remainingTracked | ConvertTo-Json -Depth 5 | Set-Content -Path $trackingFilePath -Encoding UTF8
        Write-Host "`n[UPDATED] Preserved component records retained in '$trackingFilePath'" -ForegroundColor Cyan
    } else {
        if (Test-Path $trackingFilePath) {
            Remove-Item -Path $trackingFilePath -Force -ErrorAction SilentlyContinue
            Write-Host "`n[CLEANED] All test listings deleted. Removed '$trackingFilePath'" -ForegroundColor Cyan
        }
    }
}

# 6. Summary
Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host " Cleanup Summary:" -ForegroundColor Yellow
if ($DryRun) {
    Write-Host "  Listings previewed to DELETE: $deletedCount" -ForegroundColor Yellow
    Write-Host "  Protected / preserved listings: $preservedCount" -ForegroundColor Green
    Write-Host "  Database modifications made  : 0 (DRY RUN MODE)" -ForegroundColor Cyan
} else {
    Write-Host "  Listings successfully DELETED: $deletedCount" -ForegroundColor Green
    Write-Host "  Listings PRESERVED (protected/conflict): $preservedCount" -ForegroundColor Cyan
}
Write-Host "==========================================================" -ForegroundColor Yellow
