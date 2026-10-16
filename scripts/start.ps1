param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$runtimeDirectory = Join-Path $projectRoot '.runtime'
$processFile = Join-Path $runtimeDirectory 'servers.json'
$startedProcesses = [System.Collections.Generic.List[System.Diagnostics.Process]]::new()

function Test-NexoEndpoint {
    param([string]$Url, [switch]$Frontend)
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 2
        if ($Frontend) { return $response.Content -match '<title>NEXO' }
        $health = $response.Content | ConvertFrom-Json
        return $health.status -eq 'ok' -and $health.platform -eq 'NEXO'
    } catch { return $false }
}

function Wait-NexoEndpoint {
    param([string]$Url, [System.Diagnostics.Process]$Process, [switch]$Frontend)
    $deadline = (Get-Date).AddSeconds(40)
    do {
        if (Test-NexoEndpoint -Url $Url -Frontend:$Frontend) { return }
        if ($Process.HasExited) { throw "O servidor terminou antes de responder em $Url. Consulte os logs em $runtimeDirectory." }
        Start-Sleep -Milliseconds 500
    } while ((Get-Date) -lt $deadline)
    throw "O servidor nao respondeu em $Url. Consulte os logs em $runtimeDirectory."
}

try {
    Write-Host 'NEXO - A verificar o ambiente e iniciar os servidores...'
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $nodeDirectory = Join-Path $env:ProgramFiles 'nodejs'
        if (Test-Path (Join-Path $nodeDirectory 'node.exe')) { $env:PATH = "$nodeDirectory;$env:PATH" }
    }
    $node = (Get-Command node -ErrorAction Stop).Source
    $npm = (Get-Command npm.cmd -ErrorAction Stop).Source
    $nodeVersion = [version]((& $node -p 'process.versions.node') | Select-Object -Last 1)
    if ($nodeVersion -lt [version]'22.16.0') { throw 'Instale Node.js 22.16 ou superior.' }
    New-Item -ItemType Directory -Path $runtimeDirectory -Force | Out-Null

    $environmentFile = Join-Path $projectRoot 'backend\.env'
    if (-not (Test-Path -LiteralPath $environmentFile)) {
        Copy-Item -LiteralPath (Join-Path $projectRoot 'backend\.env.example') -Destination $environmentFile
    }
    $portSetting = Get-Content -LiteralPath $environmentFile | Where-Object { $_ -match '^\s*PORT\s*=' } | Select-Object -Last 1
    if ($portSetting -and $portSetting -notmatch '^\s*PORT\s*=\s*["'']?5000["'']?\s*$') {
        throw 'O arranque local usa a porta 5000. Configure PORT=5000 em backend/.env.'
    }
    if ($env:PORT -and $env:PORT -ne '5000') { throw 'A variavel PORT do terminal deve ser 5000 para o arranque local.' }

    foreach ($service in @('backend', 'frontend')) {
        if (-not (Test-Path (Join-Path $projectRoot "$service\node_modules\.package-lock.json"))) {
            Write-Host "A instalar dependencias de $service..."
            & $npm --prefix (Join-Path $projectRoot $service) ci
            if ($LASTEXITCODE -ne 0) { throw "Falhou a instalacao de dependencias de $service." }
        }
    }

    & (Join-Path $PSScriptRoot 'start-database.ps1') -NodePath $node
    & $npm --prefix (Join-Path $projectRoot 'backend') run migrate
    if ($LASTEXITCODE -ne 0) { throw 'Falhou a verificacao das migracoes PostgreSQL.' }

    if (-not (Test-NexoEndpoint 'http://127.0.0.1:5000/api/health')) {
        $backend = Start-Process -FilePath $node -ArgumentList @('--watch', 'src/server.js') -WorkingDirectory (Join-Path $projectRoot 'backend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDirectory 'backend.log') -RedirectStandardError (Join-Path $runtimeDirectory 'backend.error.log')
        $startedProcesses.Add($backend)
        Wait-NexoEndpoint -Url 'http://127.0.0.1:5000/api/health' -Process $backend
    }
    if (-not (Test-NexoEndpoint 'http://127.0.0.1:5173' -Frontend)) {
        $frontend = Start-Process -FilePath $node -ArgumentList @('node_modules/vite/bin/vite.js', '--host', '127.0.0.1', '--strictPort') -WorkingDirectory (Join-Path $projectRoot 'frontend') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtimeDirectory 'frontend.log') -RedirectStandardError (Join-Path $runtimeDirectory 'frontend.error.log')
        $startedProcesses.Add($frontend)
        Wait-NexoEndpoint -Url 'http://127.0.0.1:5173' -Process $frontend -Frontend
    }
    if (-not (Test-NexoEndpoint 'http://127.0.0.1:5173/api/health')) {
        throw 'O frontend arrancou mas nao consegue contactar a API pelo proxy. Consulte frontend/vite.config.js.'
    }
    $records = @{}
    if (Test-Path -LiteralPath $processFile) {
        $saved = Get-Content -Raw -LiteralPath $processFile | ConvertFrom-Json
        foreach ($entry in $saved.PSObject.Properties) { $records[$entry.Name] = $entry.Value }
    }
    foreach ($process in $startedProcesses) {
        $records["$($process.Id)"] = @{ id = $process.Id; startTicks = $process.StartTime.ToUniversalTime().Ticks }
    }
    ConvertTo-Json -InputObject $records | Set-Content -LiteralPath $processFile -Encoding UTF8
    Write-Host 'Frontend: http://localhost:5173'
    Write-Host 'API:      http://localhost:5000/api/health'
    Write-Host "Logs:     $runtimeDirectory"
    Write-Host 'Servidores confirmados. Pode fechar esta janela e continuar a usar a aplicacao.'
    Write-Host 'Para encerrar os servidores, execute stop.bat.'
    if (-not $NoBrowser) { Start-Process 'http://localhost:5173' }
    exit 0
} catch {
    foreach ($process in $startedProcesses) {
        if (-not $process.HasExited) { & taskkill.exe /PID $process.Id /T /F 2>$null | Out-Null }
    }
    Write-Host "Falha no arranque: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
