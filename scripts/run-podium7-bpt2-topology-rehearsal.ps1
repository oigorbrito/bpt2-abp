param(
    [Parameter(Mandatory=$true)][string]$Bpt2Root,
    [Parameter(Mandatory=$true)][string]$PodiumRoot,
    [int]$Pairs = 3,
    [string]$Output = "artifacts/podium7-bpt2-topology-rehearsal.json",
    [int]$Port = 5110
)

$ErrorActionPreference = 'Stop'
$expectedBpt2 = 'cf08bebae8efdf1904f25355c540ca63478b6573'
$expectedPodium = '939f0452a9c6d3558e2951a48fe8291796645c33'
$container = "bpt2-podium-topology-$PID"
$baseUrl = "http://127.0.0.1:$Port"
$connection = "Host=127.0.0.1;Port=5432;Database=BomPraTi;Username=postgres;Password=postgres"
$host = $null
$bootstrap = [ordered]@{}

function Measure-Step([scriptblock]$Block) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    & $Block
    $sw.Stop()
    return [math]::Round($sw.Elapsed.TotalSeconds, 6)
}

try {
    foreach ($cmd in @('git','docker','dotnet','python','bash')) {
        if (-not (Get-Command $cmd -ErrorAction SilentlyContinue)) { throw "$cmd is required" }
    }

    $bpt2Head = (git -C $Bpt2Root rev-parse HEAD).Trim()
    $podiumHead = (git -C $PodiumRoot rev-parse HEAD).Trim()
    if ($bpt2Head -ne $expectedBpt2) { throw "BPT2 head drift: expected $expectedBpt2 got $bpt2Head" }
    if ($podiumHead -ne $expectedPodium) { throw "Podium7 head drift: expected $expectedPodium got $podiumHead" }

    $bootstrap.postgres_start_s = Measure-Step {
        docker rm -f $container 2>$null | Out-Null
        docker run --name $container -e POSTGRES_DB=BomPraTi -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:17-alpine | Out-Null
        for ($i=0; $i -lt 60; $i++) {
            docker exec $container pg_isready -U postgres -d BomPraTi *> $null
            if ($LASTEXITCODE -eq 0) { return }
            Start-Sleep -Seconds 1
        }
        throw 'PostgreSQL did not become ready'
    }

    $env:BPT_DB_CONNECTION = $connection
    $bootstrap.migrations_s = Measure-Step {
        Push-Location $Bpt2Root
        try { bash scripts/fresh-migration-gate.sh } finally { Pop-Location }
        if ($LASTEXITCODE -ne 0) { throw 'fresh migration gate failed' }
    }

    $env:ConnectionStrings__Default = $connection
    $env:ASPNETCORE_URLS = $baseUrl
    $env:ASPNETCORE_ENVIRONMENT = 'Development'
    $env:App__SelfUrl = $baseUrl
    $env:AuthServer__Authority = $baseUrl
    $env:AuthServer__RequireHttpsMetadata = 'false'

    $bootstrap.host_build_s = Measure-Step {
        dotnet build (Join-Path $Bpt2Root 'main/BomPraTi/BomPraTi.csproj') --configuration Release --nologo
        if ($LASTEXITCODE -ne 0) { throw 'BPT2 host build failed' }
    }

    $dll = Join-Path $Bpt2Root 'main/BomPraTi/bin/Release/net10.0/BomPraTi.dll'
    $host = Start-Process dotnet -ArgumentList @($dll) -PassThru -NoNewWindow
    $bootstrap.host_ready_s = Measure-Step {
        for ($i=0; $i -lt 60; $i++) {
            try {
                Invoke-WebRequest "$baseUrl/swagger/v1/swagger.json" -UseBasicParsing -TimeoutSec 2 | Out-Null
                return
            } catch { Start-Sleep -Seconds 1 }
        }
        throw 'BPT2 host did not become ready'
    }

    $tokenResponse = Invoke-RestMethod -Method Post -Uri "$baseUrl/connect/token" -ContentType 'application/x-www-form-urlencoded' -Body @{
        grant_type='password'; client_id='BomPraTi_App'; username='admin'; password='1q2w3E*'; scope='BomPraTi'
    }
    if (-not $tokenResponse.access_token) { throw 'admin access token was not returned' }
    $env:BPT2_BASE_URL = $baseUrl
    $env:BPT2_ACCESS_TOKEN = $tokenResponse.access_token

    Push-Location $PodiumRoot
    try {
        python scripts/bpt2_http_e2e.py
        if ($LASTEXITCODE -ne 0) { throw 'pre-benchmark E2E failed' }
    } finally { Pop-Location }

    $runner = Join-Path $PSScriptRoot 'rehearse-podium7-bpt2-topology.py'
    python $runner --bpt2-root $Bpt2Root --podium-root $PodiumRoot --pairs $Pairs --e2e --output $Output
    if ($LASTEXITCODE -ne 0) { throw "topology rehearsal failed with exit code $LASTEXITCODE" }

    $bootstrapPath = [System.IO.Path]::ChangeExtension($Output, '.bootstrap.json')
    $bootstrap.total_s = [math]::Round(($bootstrap.postgres_start_s + $bootstrap.migrations_s + $bootstrap.host_build_s + $bootstrap.host_ready_s), 6)
    [ordered]@{
        schema='bpt2.podium7-topology-bootstrap.v1'
        heads=[ordered]@{ bpt2=$bpt2Head; podium7=$podiumHead }
        base_url=$baseUrl
        timings_s=$bootstrap
        excluded_from_paired_harness_timing=$true
    } | ConvertTo-Json -Depth 6 | Set-Content -Encoding UTF8 $bootstrapPath

    Write-Host "TOPOLOGY_REHEARSAL: PASS"
    Write-Host "artifact=$Output"
    Write-Host "bootstrap=$bootstrapPath"
}
finally {
    if ($host -and -not $host.HasExited) { Stop-Process -Id $host.Id -Force -ErrorAction SilentlyContinue }
    docker rm -f $container 2>$null | Out-Null
}
