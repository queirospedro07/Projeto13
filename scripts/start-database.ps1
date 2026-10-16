param([Parameter(Mandatory=$true)][string]$NodePath)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
function Test-DockerReady {
    $ErrorActionPreference = 'Continue'
    & docker info --format '{{.ServerVersion}}' *> $null
    return $LASTEXITCODE -eq 0
}
$mode = & $NodePath (Join-Path $projectRoot 'backend/scripts/prepare-database.js')
if ($LASTEXITCODE -ne 0) { throw 'Falhou a configuracao da base de dados.' }
if ($mode -ne 'managed') { return }
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { throw 'Instale e inicie Docker Desktop, ou configure um PostgreSQL externo com LOCAL_POSTGRES_DOCKER=false.' }
if (-not (Test-DockerReady)) {
    Write-Host 'A iniciar Docker Desktop...'
    & docker desktop start --detach
    if ($LASTEXITCODE -ne 0) { throw 'Inicie Docker Desktop antes de executar start.bat.' }
    $deadline = (Get-Date).AddSeconds(50)
    do {
        Start-Sleep -Seconds 2
        if (Test-DockerReady) { break }
    } while ((Get-Date) -lt $deadline)
    if (-not (Test-DockerReady)) { throw 'Docker Desktop ainda nao esta pronto. Tente novamente depois de iniciar.' }
}
& docker volume create nexo-postgres-data | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Falhou a preparacao do volume PostgreSQL.' }
& docker compose --project-directory $projectRoot -f (Join-Path $projectRoot 'compose.yaml') up -d --wait --wait-timeout 60
if ($LASTEXITCODE -ne 0) { throw 'Falhou o arranque do PostgreSQL. Consulte docker compose logs database.' }
