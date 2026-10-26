param(
    [ValidateSet('Plan','Apply','Rollback')][string]$Mode = 'Plan',
    [Parameter(Mandatory)][string]$PlanFile,
    [string]$ApprovedSha,
    [string]$ApprovedPlanHash,
    [switch]$RunnerAccessVerified,
    [switch]$DiagnosticAccessVerified
)
$ErrorActionPreference = 'Stop'
# A reviewed, existing app/database only. No new paid resources or SKU changes.
$auditSubscription = '57c41f8a-69de-4655-bea5-fad30de6921a'
$auditGroup = 'rg-binso-admin-prod'
$auditApp = 'binso-admin-prod'
$auditServer = 'binso-platform-db'
function Invoke-AuditAzure([string[]]$Arguments) {
    $result = & az @Arguments
    if ($LASTEXITCODE -ne 0) { throw 'Azure operation failed; inspect the operation before retrying.' }
    return $result
}
function Read-AuditSnapshot {
    $app = Invoke-AuditAzure @('webapp','show','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'-o','json') | ConvertFrom-Json
    $config = Invoke-AuditAzure @('webapp','config','show','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'-o','json') | ConvertFrom-Json
    $rules = Invoke-AuditAzure @('postgres','flexible-server','firewall-rule','list','--subscription',$auditSubscription,'-g',$auditGroup,'--server-name',$auditServer,'-o','json') | ConvertFrom-Json
    $tls = Invoke-AuditAzure @('webapp','config','appsettings','list','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'--query',"[?name=='DATABASE_SSL_REJECT_UNAUTHORIZED'].value | [0]",'-o','tsv')
    $ips = @(($app.outboundIpAddresses+','+$app.possibleOutboundIpAddresses).Split(',') | Where-Object { $_ } | Sort-Object -Unique)
    foreach ($ip in $ips) { $address = $null; if (-not [Net.IPAddress]::TryParse($ip,[ref]$address) -or $address.AddressFamily -ne 'InterNetwork' -or $ip -eq '0.0.0.0') { throw 'Invalid app egress address' } }
    if ($ips.Count -eq 0) { throw 'App egress addresses missing' }
    return [ordered]@{outboundIps=$ips;http20Enabled=$config.http20Enabled;ftpsState=$config.ftpsState;tlsReject=[string]$tls;rules=@($rules | Sort-Object name | ForEach-Object { [ordered]@{name=$_.name;startIpAddress=$_.startIpAddress;endIpAddress=$_.endIpAddress} })}
}
function Set-AuditRule($name,$start,$end) {
    Invoke-AuditAzure @('postgres','flexible-server','firewall-rule','create','--subscription',$auditSubscription,'-g',$auditGroup,'--server-name',$auditServer,'--name',$name,'--start-ip-address',$start,'--end-ip-address',$end,'-o','none') | Out-Null
}
$sourceSha = (& git rev-parse HEAD).Trim()
if ($LASTEXITCODE -ne 0 -or $sourceSha -notmatch '^[a-f0-9]{40}$') { throw 'Run from the activated hardening checkout.' }
& git diff --quiet HEAD -- scripts/azure-hardening.ps1
if ($LASTEXITCODE -ne 0) { throw 'Commit and review this script before preparing or applying a source-bound plan.' }
if ($Mode -eq 'Plan') {
    if (Test-Path -LiteralPath $PlanFile) { throw 'Refusing to overwrite an existing review plan.' }
    $snapshot = Read-AuditSnapshot
    $plan = [ordered]@{version=1;sourceSha=$sourceSha;subscription=$auditSubscription;resourceGroup=$auditGroup;app=$auditApp;server=$auditServer;before=$snapshot;requiresAppRestart=$true;newRecurringResources=0;requiresVerifiedRunnerAccess=$true;retireHistoricalClientRule=$false}
    [IO.File]::WriteAllText($PlanFile,($plan | ConvertTo-Json -Depth 10),[Text.UTF8Encoding]::new($false))
    Get-FileHash -LiteralPath $PlanFile -Algorithm SHA256 | Select-Object Hash,Path
    return
}
if ($ApprovedSha -ne $sourceSha -or $ApprovedPlanHash -notmatch '^[a-fA-F0-9]{64}$') { throw 'Exact source SHA and reviewed plan hash are required.' }
if ((Get-FileHash -LiteralPath $PlanFile -Algorithm SHA256).Hash -ne $ApprovedPlanHash) { throw 'Plan bytes changed after review.' }
$plan = Get-Content -LiteralPath $PlanFile -Raw | ConvertFrom-Json
if ($plan.sourceSha -ne $sourceSha -or $plan.subscription -ne $auditSubscription -or $plan.app -ne $auditApp -or $plan.server -ne $auditServer -or $plan.resourceGroup -ne $auditGroup) { throw 'Plan target or source mismatch.' }
function Restore-AuditConfiguration {
    # Restore connectivity before removing the newly scoped rules.
    foreach ($rule in $plan.before.rules) { Set-AuditRule $rule.name $rule.startIpAddress $rule.endIpAddress }
    Invoke-AuditAzure @('webapp','config','set','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'--http20-enabled',([string]$plan.before.http20Enabled).ToLower(),'--ftps-state',$plan.before.ftpsState,'-o','none') | Out-Null
    Invoke-AuditAzure @('webapp','config','appsettings','set','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'--settings',('DATABASE_SSL_REJECT_UNAUTHORIZED='+$plan.before.tlsReject),'-o','none') | Out-Null
    for ($index=0; $index -lt $plan.before.outboundIps.Count; $index++) {
        $name='binso-app-egress-'+$index
        if ($name -notin $plan.before.rules.name) { Invoke-AuditAzure @('postgres','flexible-server','firewall-rule','delete','--subscription',$auditSubscription,'-g',$auditGroup,'--server-name',$auditServer,'--name',$name,'--yes','-o','none') | Out-Null }
    }
}
if ($Mode -eq 'Rollback') { Restore-AuditConfiguration; return }
if (-not $RunnerAccessVerified) { throw 'First prove scoped runner access in CI; otherwise migrations and maintenance would lose connectivity.' }
if (-not $DiagnosticAccessVerified) { throw 'First prove the separately authorized read-only diagnostic access path; do not break it through firewall hardening.' }
$current = Read-AuditSnapshot
if (($current | ConvertTo-Json -Depth 10 -Compress) -ne ($plan.before | ConvertTo-Json -Depth 10 -Compress)) { throw 'Live settings drifted; prepare a new plan.' }
try {
    for ($index=0; $index -lt $plan.before.outboundIps.Count; $index++) { Set-AuditRule ('binso-app-egress-'+$index) $plan.before.outboundIps[$index] $plan.before.outboundIps[$index] }
    foreach ($rule in $plan.before.rules) {
        if ($rule.startIpAddress -eq '0.0.0.0' -and $rule.endIpAddress -eq '0.0.0.0') { Invoke-AuditAzure @('postgres','flexible-server','firewall-rule','delete','--subscription',$auditSubscription,'-g',$auditGroup,'--server-name',$auditServer,'--name',$rule.name,'--yes','-o','none') | Out-Null }
    }
    Invoke-AuditAzure @('webapp','config','set','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'--http20-enabled','true','--ftps-state','Disabled','-o','none') | Out-Null
    Invoke-AuditAzure @('webapp','config','appsettings','set','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp,'--settings','DATABASE_SSL_REJECT_UNAUTHORIZED=true','-o','none') | Out-Null
    Invoke-AuditAzure @('webapp','restart','--subscription',$auditSubscription,'-g',$auditGroup,'-n',$auditApp) | Out-Null
    $ready=$false
    for ($attempt=0; $attempt -lt 18; $attempt++) {
        try { $response=Invoke-RestMethod -Uri 'https://binso-admin-prod-asctesfvhnd5b6ay.switzerlandnorth-01.azurewebsites.net/api/health/ready' -TimeoutSec 10; if ($response.status -eq 'ready') { $ready=$true; break } } catch { }
        Start-Sleep -Seconds 10
    }
    if (-not $ready) { throw 'New worker could not prove live database readiness.' }
    Write-Output 'Scoped firewall, verified TLS setting, HTTP/2 and disabled FTP applied. Historical client rule retained for explicit owner review.'
} catch { Restore-AuditConfiguration; throw }
