$ErrorActionPreference='Stop'
$auditTestRoot=Join-Path ([IO.Path]::GetTempPath()) ('binso-hardening-'+[guid]::NewGuid())
New-Item -ItemType Directory -Path $auditTestRoot | Out-Null
$global:auditTestCalls=[Collections.Generic.List[object]]::new()
$global:auditTestState=@{outboundIpAddresses='203.0.113.5';possibleOutboundIpAddresses='203.0.113.5,203.0.113.6';http20Enabled=$false;ftpsState='FtpsOnly';tls='false';rules=@(@{name='old-azure';startIpAddress='0.0.0.0';endIpAddress='0.0.0.0'})}
function global:git { $global:LASTEXITCODE=0; if($args[0] -eq 'rev-parse'){'a'*40} }
function global:az {
    $arguments=@($args);$global:LASTEXITCODE=0
    $global:auditTestCalls.Add($arguments)
    $command=$arguments -join ' '
    if($command -match '^webapp show') { return ($global:auditTestState|ConvertTo-Json -Depth 5) }
    if($command -match '^webapp config show') { return ($global:auditTestState|ConvertTo-Json -Depth 5) }
    if($command -match '^webapp config appsettings list') { return $global:auditTestState.tls }
    if($command -match '^postgres flexible-server firewall-rule list') { return (ConvertTo-Json -InputObject @($global:auditTestState.rules) -Depth 5) }
    if($command -match '^postgres flexible-server firewall-rule (create|delete)|^webapp (config (set|appsettings set)|restart)') { return }
    throw ('Unexpected Azure operation in test: '+$command)
}
function global:Invoke-RestMethod { return @{status='ready'} }
function Assert-AuditTest($Condition,$Message){if(-not $Condition){throw $Message}}
try {
    $plan=Join-Path $auditTestRoot 'plan.json'
    & ./scripts/azure-hardening.ps1 -PlanFile $plan | Out-Null
    Assert-AuditTest (-not @($global:auditTestCalls|Where-Object {($_ -join ' ') -match ' (create|delete|set|restart) '}).Count) 'Plan must be read-only'
    $hash=(Get-FileHash -LiteralPath $plan).Hash
    foreach($case in @('sha','hash','runner','diagnostic','drift')){
        $global:auditTestCalls.Clear();$caught=$false
        try{
            $sha=if($case -eq 'sha'){'b'*40}else{'a'*40}
            $digest=if($case -eq 'hash'){'0'*64}else{$hash}
            if($case -eq 'drift'){$global:auditTestState.ftpsState='AllAllowed'}
            & ./scripts/azure-hardening.ps1 -Mode Apply -PlanFile $plan -ApprovedSha $sha -ApprovedPlanHash $digest -RunnerAccessVerified:($case -ne 'runner') -DiagnosticAccessVerified:($case -ne 'diagnostic')
        }catch{$caught=$true}finally{$global:auditTestState.ftpsState='FtpsOnly'}
        Assert-AuditTest $caught ('Unsafe apply must fail: '+$case)
        Assert-AuditTest (-not @($global:auditTestCalls|Where-Object {($_ -join ' ') -match ' (create|delete|set|restart) '}).Count) ('Refused apply cannot mutate Azure: '+$case)
    }
    $global:auditTestCalls.Clear()
    & ./scripts/azure-hardening.ps1 -Mode Apply -PlanFile $plan -ApprovedSha ('a'*40) -ApprovedPlanHash $hash -RunnerAccessVerified -DiagnosticAccessVerified
    $joined=@($global:auditTestCalls|ForEach-Object {$_ -join ' '})
    Assert-AuditTest (@($joined|Where-Object {$_ -match 'firewall-rule create'}).Count -eq 2) 'Only exact app IPs are allowed'
    Assert-AuditTest (-not @($joined|Where-Object {$_ -match 'firewall-rule create.*0\.0\.0\.0'}).Count) 'Apply must never create an Azure-wide rule'
    Assert-AuditTest (@($joined|Where-Object {$_ -match 'firewall-rule delete.*old-azure'}).Count -eq 1) 'Retire the reviewed broad rule'
    Assert-AuditTest (@($joined|Where-Object {$_ -match 'DATABASE_SSL_REJECT_UNAUTHORIZED=true'}).Count -eq 1) 'Consolidate certificate verification'
    Write-Output 'Azure hardening: read-only plan; SHA/hash/runner/drift refusals without writes; exact IP changes, TLS and restart verified against isolated CLI peer.'
}finally{
    Remove-Item Function:git,Function:az,Function:Invoke-RestMethod
    # Delete only the dedicated, verified test directory.
    $resolved=[IO.Path]::GetFullPath($auditTestRoot)
    if(-not $resolved.StartsWith([IO.Path]::GetTempPath(),[StringComparison]::OrdinalIgnoreCase) -or (Split-Path $resolved -Leaf) -notlike 'binso-hardening-*'){throw 'Unexpected cleanup target'}
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
