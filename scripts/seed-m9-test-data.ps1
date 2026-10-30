<#
.SYNOPSIS
    Seeds 12 realistic electronics component listings into CoreHub for Milestone 9 marketplace testing.

.DESCRIPTION
    Creates temporary test listings with category diversity (Microcontrollers, Sensors & Transducers,
    Wireless & IoT, Lab & Prototyping, Power & Discrete), listing types (SELL, SWAP, BORROW), and
    searchable keywords (ESP32, STM32, Arduino Nano, ultrasonic sensor, breadboard).

    All titles are prefixed with '[M9 TEST]' for unambiguous identification.
    Saves created component records to 'scripts/m9-test-components.json' for safe tracking and cleanup.

.PARAMETER BaseUrl
    Base URL of the CoreHub backend server. Default is 'http://localhost:8080'.

.PARAMETER Token
    Optional existing JWT access token. If omitted, prompts for credentials to log in dynamically.

.PARAMETER Email
    Optional student email for login. If omitted and Token is not provided, prompts interactively.

.PARAMETER Password
    Optional student password for login. If omitted and Token is not provided, prompts securely.

.PARAMETER DryRun
    When specified, inspects existing listings and displays a preview of what would be created
    without making any POST requests or database modifications.

.EXAMPLE
    # Preview what would be created without making changes
    .\scripts\seed-m9-test-data.ps1 -DryRun

.EXAMPLE
    # Seed listings interactively (will prompt for email and password securely)
    .\scripts\seed-m9-test-data.ps1

.EXAMPLE
    # Seed listings with an existing JWT token
    .\scripts\seed-m9-test-data.ps1 -Token "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
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

# 12 Realistic Milestone 9 Test Listings
$testListings = @(
    @{
        title          = "[M9 TEST] ESP32-WROOM-32 Wi-Fi & BLE Development Board"
        category       = "Microcontrollers"
        listingType    = "SELL"
        price          = 1850.00
        description    = "Dual-core Xtensa 32-bit LX6 microprocessor with integrated Wi-Fi and Bluetooth LE. Ideal for IoT prototypes and semester design projects."
        specifications = "Chip: ESP32-D0WDQ6, Clock: 240MHz, RAM: 520KB, Flash: 4MB, Micro-USB connector, 30 GPIO pins."
    },
    @{
        title          = "[M9 TEST] STM32F401RE Nucleo-64 ARM Cortex-M4 Board"
        category       = "Microcontrollers"
        listingType    = "BORROW"
        price          = $null
        description    = "Official STMicroelectronics Nucleo-64 development board featuring STM32F401RE microcontroller. Available for short-term borrow for Embedded Systems lab coursework."
        specifications = "Core: ARM Cortex-M4 with FPU, 84 MHz CPU, 512KB Flash, 96KB SRAM, Arduino Uno V3 & ST Morpho headers, onboard ST-LINK/V2-1 debugger."
    },
    @{
        title          = "[M9 TEST] Arduino Nano V3 ATmega328P with CH340"
        category       = "Microcontrollers"
        listingType    = "SELL"
        price          = 1200.00
        description    = "Compact breadboard-friendly Arduino Nano board with pre-soldered pin headers and Mini-USB interface. Tested and works with Arduino IDE."
        specifications = "Microcontroller: ATmega328P, Operating Voltage: 5V, Input Voltage: 7-12V, 14 Digital I/O, 8 Analog Inputs, 16MHz Clock."
    },
    @{
        title          = "[M9 TEST] Raspberry Pi Pico RP2040 Dual Core Microcontroller"
        category       = "Microcontrollers"
        listingType    = "SWAP"
        price          = $null
        description    = "Raspberry Pi Pico board with dual ARM Cortex-M0+ cores. Looking to swap for an Arduino Pro Mini 3.3V or similar low-power board."
        specifications = "Processor: Dual-core Arm Cortex-M0+ @ 133MHz, 264KB SRAM, 2MB onboard QSPI Flash, 26 multi-function GPIO pins, Micro-USB."
    },
    @{
        title          = "[M9 TEST] HC-SR04 Ultrasonic Distance Sensor Module"
        category       = "Sensors & Transducers"
        listingType    = "SELL"
        price          = 450.00
        description    = "High-accuracy ultrasonic distance measuring sensor module. Contactless measurement range from 2cm to 400cm. Perfect for robotics obstacle avoidance."
        specifications = "Operating Voltage: 5V DC, Operating Current: 15mA, Frequency: 40kHz, Measuring Angle: 15 degrees, Resolution: 3mm."
    },
    @{
        title          = "[M9 TEST] MPU-6050 6-Axis Accelerometer and Gyroscope"
        category       = "Sensors & Transducers"
        listingType    = "SWAP"
        price          = $null
        description    = "GY-521 breakout board with MPU-6050 3-axis gyro and 3-axis accelerometer with built-in Digital Motion Processor (DMP). Open to swap for an I2C OLED display."
        specifications = "Interface: I2C (up to 400kHz), Gyro Range: +/-250, 500, 1000, 2000 deg/s, Accel Range: +/-2, 4, 8, 16g, Operating Voltage: 3.3V-5V."
    },
    @{
        title          = "[M9 TEST] DHT22 Digital Temperature & Humidity Sensor"
        category       = "Sensors & Transducers"
        listingType    = "SELL"
        price          = 850.00
        description    = "Calibrated AM2302 / DHT22 sensor for precision ambient temperature and relative humidity measurement. Pre-wired with pull-up resistor."
        specifications = "Temperature Range: -40 to 80 deg C (+/-0.5 deg C), Humidity Range: 0-100% RH (+/-2% RH), Single-bus digital signal output, 3.3V-5.5V."
    },
    @{
        title          = "[M9 TEST] nRF24L01+ 2.4GHz Wireless Transceiver with Antenna"
        category       = "Wireless & IoT"
        listingType    = "SELL"
        price          = 650.00
        description    = "PA+LNA 2.4GHz RF transceiver module with SMA external antenna. Line-of-sight communication range up to 1000m for drone telemetry or sensor nodes."
        specifications = "Frequency: 2.4GHz ISM band, Data Rate: 250kbps to 2Mbps, Supply Voltage: 1.9V - 3.6V (5V tolerant logic inputs), SPI interface."
    },
    @{
        title          = "[M9 TEST] LoRa SX1278 433MHz Ra-02 Long Range RF Transceiver"
        category       = "Wireless & IoT"
        listingType    = "BORROW"
        price          = $null
        description    = "Ra-02 LoRa spread spectrum communication module operating at 433MHz. Lent out for remote agricultural telemetry or field mesh tests."
        specifications = "Chipset: Semtech SX1278, Frequency: 433MHz, Sensitivity: down to -148dBm, Output Power: +20dBm, SPI bus, IPEX antenna connector."
    },
    @{
        title          = "[M9 TEST] Solderless MB-102 830-Point Breadboard with Power Rails"
        category       = "Lab & Prototyping"
        listingType    = "SELL"
        price          = 950.00
        description    = "Standard 830 tie-point solderless breadboard with dual distribution power rails and adhesive backing. Clean, contacts are tight and unbent."
        specifications = "Tie Points: 630 terminal points + 200 distribution points, Pitch: standard 2.54mm (0.1in), Accepts 20-29 AWG wire."
    },
    @{
        title          = "[M9 TEST] 8-Channel 24MHz USB Logic Analyzer for Digital Signals"
        category       = "Lab & Prototyping"
        listingType    = "BORROW"
        price          = $null
        description    = "Portable 8-channel USB logic analyzer compatible with PulseView / Sigrok. Perfect for debugging I2C, SPI, UART, and PWM protocols in lab."
        specifications = "Channels: 8, Max Sampling Rate: 24MHz, Input Voltage: 0V - 5.5V (3.3V and 5V CMOS compatible), Includes female-to-female test leads."
    },
    @{
        title          = "[M9 TEST] LM2596 Adjustable DC-DC Buck Step-Down Power Module"
        category       = "Power & Discrete"
        listingType    = "SWAP"
        price          = $null
        description    = "High-efficiency step-down switching voltage regulator board. Stepping down 4V-35V to 1.23V-30V with multiturn trimmer. Swap for breadboard jumper cables."
        specifications = "Input: 4.5V-35V, Output: 1.25V-30V adjustable, Max Output Current: 3A (heatsink recommended above 2A), Switching Frequency: 150kHz."
    }
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " CoreHub Milestone 9 Test Data Seed Script" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Backend URL : $BaseUrl"
Write-Host "Mode        : $(if ($DryRun) { '[DRY RUN] Preview only - no modifications will be made' } else { 'LIVE CREATION' })"
Write-Host ""

# 1. Health Check
try {
    $health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Backend server reachable: Status '$($health.status)'" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Could not connect to CoreHub backend at $BaseUrl" -ForegroundColor Red
    Write-Host "Please ensure the Spring Boot backend is running before seeding test data." -ForegroundColor Yellow
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
        Write-Host "Logged in as : $($loginResp.user.name) (ID: $($loginResp.user.id), Role: $($loginResp.user.role))" -ForegroundColor Gray
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

# 3. Query Existing Listings for Duplicate Prevention
Write-Host "`nChecking for existing listings to prevent duplicates..." -NoNewline
$existingTitles = @{}
$existingById = @{}
try {
    # Check user's own listings
    $myComponents = Invoke-RestMethod -Uri "$BaseUrl/api/components/mine" -Method Get -Headers $authHeaders -ErrorAction Stop
    if ($myComponents) {
        foreach ($c in $myComponents) {
            $existingTitles[$c.title] = $c
            $existingById[$c.id] = $c
        }
    }

    # Also search general marketplace for [M9 TEST]
    $m9Search = Invoke-RestMethod -Uri "$BaseUrl/api/components?search=%5BM9+TEST%5D&size=100&status=AVAILABLE" -Method Get -Headers $authHeaders -ErrorAction SilentlyContinue
    if ($m9Search -and $m9Search.content) {
        foreach ($c in $m9Search.content) {
            $existingTitles[$c.title] = $c
            $existingById[$c.id] = $c
        }
    }
    Write-Host " [Found $($existingTitles.Count) existing listings]" -ForegroundColor Gray
} catch {
    Write-Host " [Warning: could not inspect existing components: $($_.Exception.Message)]" -ForegroundColor Yellow
}

# 4. Preview / Seed Listings
Write-Host "`nProcessing 12 listings..." -ForegroundColor Cyan
Write-Host "----------------------------------------------------------" -ForegroundColor Gray

$results = @()
$createdCount = 0
$skippedCount = 0

$trackingFilePath = Join-Path -Path $PSScriptRoot -ChildPath "m9-test-components.json"
$trackedComponents = @()
if (Test-Path $trackingFilePath) {
    try {
        $trackedComponents = @(Get-Content -Path $trackingFilePath -Raw | ConvertFrom-Json)
    } catch {
        $trackedComponents = @()
    }
}

$index = 1
foreach ($item in $testListings) {
    $title = $item.title
    $alreadyExists = $existingTitles.ContainsKey($title)
    $existingObj = if ($alreadyExists) { $existingTitles[$title] } else { $null }

    if ($DryRun) {
        if ($alreadyExists) {
            Write-Host ("[{0:D2}/12] [DRY RUN - WOULD SKIP] Title already exists: {1} (ID: {2})" -f $index, $title, $existingObj.id) -ForegroundColor Yellow
            $skippedCount++
        } else {
            $priceText = if ($item.price -ne $null) { "LKR $($item.price)" } else { "None ($($item.listingType))" }
            Write-Host ("[{0:D2}/12] [DRY RUN - WOULD CREATE] {1}" -f $index, $title) -ForegroundColor Green
            Write-Host ("        Category: {0} | Type: {1} | Price: {2}" -f $item.category, $item.listingType, $priceText) -ForegroundColor Gray
            $createdCount++
        }
    } else {
        if ($alreadyExists) {
            Write-Host ("[{0:D2}/12] [SKIP] Already exists: {1} (ID: {2})" -f $index, $title, $existingObj.id) -ForegroundColor Yellow
            $skippedCount++

            # Add to tracked list if not already tracked
            $alreadyTracked = $trackedComponents | Where-Object { $_.id -eq $existingObj.id }
            if (-not $alreadyTracked) {
                $trackedComponents += [PSCustomObject]@{
                    id          = $existingObj.id
                    title       = $existingObj.title
                    category    = $existingObj.category
                    listingType = $existingObj.listingType
                    createdAt   = (Get-Date).ToString("o")
                }
            }
        } else {
            # Construct JSON request payload
            $postPayload = @{
                title          = $item.title
                description    = $item.description
                category       = $item.category
                specifications = $item.specifications
                listingType    = $item.listingType
                price          = $item.price
            }
            $postJson = $postPayload | ConvertTo-Json
            $postBytes = [System.Text.Encoding]::UTF8.GetBytes($postJson)

            try {
                $createdResp = Invoke-RestMethod -Uri "$BaseUrl/api/components" `
                    -Method Post `
                    -Headers $authHeaders `
                    -Body $postBytes `
                    -ContentType "application/json; charset=utf-8" `
                    -ErrorAction Stop

                $priceText = if ($createdResp.price -ne $null) { "LKR $($createdResp.price)" } else { "N/A ($($createdResp.listingType))" }
                Write-Host ("[{0:D2}/12] [CREATED] ID: {1} | {2} | {3} | {4}" -f $index, $createdResp.id, $createdResp.title, $createdResp.category, $priceText) -ForegroundColor Green
                $createdCount++

                $trackedComponents += [PSCustomObject]@{
                    id          = $createdResp.id
                    title       = $createdResp.title
                    category    = $createdResp.category
                    listingType = $createdResp.listingType
                    createdAt   = (Get-Date).ToString("o")
                }
            } catch [System.Net.WebException] {
                $webResp = $_.Exception.Response
                if ($webResp) {
                    $reader = New-Object System.IO.StreamReader($webResp.GetResponseStream())
                    $errBody = $reader.ReadToEnd()
                    $reader.Close()
                    Write-Host ("[{0:D2}/12] [ERROR] Failed to create '{1}': {2}" -f $index, $title, $errBody) -ForegroundColor Red
                } else {
                    Write-Host ("[{0:D2}/12] [ERROR] Failed to create '{1}': {2}" -f $index, $title, $_.Exception.Message) -ForegroundColor Red
                }
            }
        }
    }
    $index++
}

# 5. Save Tracking File
if (-not $DryRun -and $trackedComponents.Count -gt 0) {
    try {
        $trackedComponents | ConvertTo-Json -Depth 5 | Set-Content -Path $trackingFilePath -Encoding UTF8
        Write-Host "`n[SAVED] Tracked test component IDs saved to '$trackingFilePath'" -ForegroundColor Cyan
    } catch {
        Write-Host "`n[WARNING] Could not save tracking file: $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

# 6. Summary
Write-Host "----------------------------------------------------------" -ForegroundColor Gray
Write-Host " Summary:" -ForegroundColor Cyan
if ($DryRun) {
    Write-Host "  Listings previewed to CREATE : $createdCount" -ForegroundColor Green
    Write-Host "  Listings already existing   : $skippedCount" -ForegroundColor Yellow
    Write-Host "  Database modifications made : 0 (DRY RUN MODE)" -ForegroundColor Cyan
} else {
    Write-Host "  Listings successfully CREATED: $createdCount" -ForegroundColor Green
    Write-Host "  Listings SKIPPED (existed)   : $skippedCount" -ForegroundColor Yellow
    Write-Host "  Total tracked test components: $($trackedComponents.Count)" -ForegroundColor Cyan
}
Write-Host "==========================================================" -ForegroundColor Cyan
