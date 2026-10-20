# Run from the repository. This script never installs tools, migrates production or deploys.
$ErrorActionPreference='Stop'
. (Join-Path $PSScriptRoot '../../runtime.ps1')
Push-Location (Join-Path $PSScriptRoot '..')
try {
    $binsoChecks=@('module-profile-test','plan-catalog-test','demo-session-test','public-demo-flow-test','client-session-test','registration-test','auth-integrity-test','workforce-regression-test','migration-test','app-workspace-test','lab-readiness-test','task-focused-ux-test','navigation-contract-test','navigation-foundation-test','operator-contract-test','localization-test','localization-coverage-test')
    foreach($binsoCheck in $binsoChecks){
        & node ('scripts/'+$binsoCheck+'.mjs')
        if($LASTEXITCODE -ne 0){throw ('Failed: '+$binsoCheck)}
    }
    & pnpm lint
    if($LASTEXITCODE -ne 0){throw 'Lint failed'}
    & pnpm typecheck
    if($LASTEXITCODE -ne 0){throw 'Typecheck failed'}
    # Full pnpm test requires its Bash/Python fixture peer. Do not suppress failures.
    # Final Linux Quality, CodeQL and browser lanes remain mandatory in GitHub.
} finally { Pop-Location }
