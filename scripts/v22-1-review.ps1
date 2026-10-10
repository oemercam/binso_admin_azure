param([Parameter(Mandatory=$true)][string]$RepoPath)
$ErrorActionPreference = 'Stop'
Set-Location $RepoPath
function Run-Checked([scriptblock]$Command) { & $Command; if ($LASTEXITCODE -ne 0) { throw "Prüfung fehlgeschlagen: $Command" } }
if ((node --version) -notmatch '^v24\.') { throw 'Node 24 ist erforderlich.' }
Run-Checked { git rev-parse --show-toplevel }
Run-Checked { git fetch origin main }
Run-Checked { git merge-base --is-ancestor cf1a98a6e783ca4f7a2c06199002d5398fd5edd4 HEAD }
if ((git branch --show-current) -ne 'feat/v22-1-customer-standard-enforcement') { throw 'Nur den V22.1-Arbeitsbranch prüfen; kein Push auf main.' }
Run-Checked { corepack enable }
Run-Checked { corepack pnpm install --frozen-lockfile }
Run-Checked { corepack pnpm run ci }
Run-Checked { git diff --check }
Run-Checked { git push -u origin HEAD }
$sha = (git rev-parse HEAD).Trim()
Run-Checked { gh run list --repo oemercam/binso_admin_azure --commit $sha --limit 10 }
$health = Invoke-RestMethod 'https://binso-admin-prod-asctesfvhnd5b6ay.switzerlandnorth-01.azurewebsites.net/api/health'
Write-Host "Arbeitscommit: $sha; bestehende Azure-Live-Version: $($health.sha)"
Write-Host 'Draft-Review: V22.1 ist noch nicht vollständig umgesetzt/abgenommen. Kein Merge/Deployment durch dieses Skript.'
