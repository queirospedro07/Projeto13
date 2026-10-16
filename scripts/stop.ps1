$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$processFile = Join-Path $projectRoot '.runtime\servers.json'
try {
    if (-not (Test-Path -LiteralPath $processFile)) {
        Write-Host 'Nao existem servidores registados por start.bat.'
        exit 0
    }
    $records = Get-Content -Raw -LiteralPath $processFile | ConvertFrom-Json
    foreach ($entry in $records.PSObject.Properties) {
        $record = $entry.Value
        $process = Get-Process -Id $record.id -ErrorAction SilentlyContinue
        # A reused process ID must never stop an unrelated application.
        if ($process -and $process.ProcessName -eq 'node' -and $process.StartTime.ToUniversalTime().Ticks -eq [long]$record.startTicks) {
            & taskkill.exe /PID $process.Id /T /F | Out-Null
            if ($LASTEXITCODE -ne 0) { throw "Nao foi possivel encerrar o processo $($process.Id)." }
        }
    }
    Remove-Item -LiteralPath $processFile
    Write-Host 'Servidores NEXO encerrados. Os dados foram conservados.'
} catch {
    Write-Host "Falha ao encerrar: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
