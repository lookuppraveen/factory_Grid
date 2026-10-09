# Starts the IAM service with variables from backend/services/iam-service/.env
# Usage (from repo root):  .\scripts\start-iam.ps1           -> spring-boot:run
#                          .\scripts\start-iam.ps1 -Test     -> mvnw clean test
param([switch]$Test)

$ErrorActionPreference = 'Stop'
$service = Join-Path $PSScriptRoot '..\backend\services\iam-service' | Resolve-Path
$envFile = Join-Path $service '.env'

if (-not (Test-Path $envFile)) {
    Write-Error "Missing $envFile. Copy .env.example to .env and fill in DB_PASSWORD and JWT_SECRET."
}

Get-Content $envFile | Where-Object { $_ -match '^\s*[A-Za-z_][A-Za-z0-9_]*\s*=' } | ForEach-Object {
    $name, $value = $_ -split '=', 2
    [Environment]::SetEnvironmentVariable($name.Trim(), $value.Trim(), 'Process')
}

foreach ($required in 'DB_PASSWORD', 'JWT_SECRET') {
    $v = [Environment]::GetEnvironmentVariable($required, 'Process')
    if ([string]::IsNullOrWhiteSpace($v) -or $v.StartsWith('<')) {
        Write-Error "$required is not set in $envFile"
    }
}

Push-Location $service
try {
    if ($Test) { .\mvnw.cmd clean test } else { .\mvnw.cmd spring-boot:run }
} finally {
    Pop-Location
}
