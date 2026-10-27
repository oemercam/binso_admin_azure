# Run explicitly after reviewing the source changes. This publishes a feature
# branch only; it does not merge, migrate a database or deploy to Azure.
param([string]$CommitMessage='Implement UV-verified passkey authentication')
$ErrorActionPreference='Stop'
$projectRoot=Split-Path -Parent $PSScriptRoot
$workspaceRoot=Split-Path -Parent $projectRoot
Set-Location -LiteralPath $workspaceRoot
. (Join-Path $workspaceRoot 'runtime.ps1')
Set-Location -LiteralPath $projectRoot
function Assert-Result([string]$step){if($LASTEXITCODE -ne 0){throw "$step failed ($LASTEXITCODE)"}}
pnpm install --frozen-lockfile
Assert-Result 'Install'
pnpm lint
Assert-Result 'Lint'
pnpm typecheck
Assert-Result 'Typecheck'
pnpm test
Assert-Result 'Tests'
pnpm build
Assert-Result 'Build'
git status --short
Assert-Result 'Git status'
git diff --check
Assert-Result 'Diff validation'
$branch=git branch --show-current
Assert-Result 'Branch lookup'
if(!$branch -or $branch -eq 'main'){throw 'Use the reviewed passkey feature branch, never main.'}
git diff --stat
# Stage only the reviewed authentication delivery; do not stage unrelated work.
git add -- .env.example .github/workflows/quality.yml AGENTS.md README.md app/api/auth/mfa/route.ts app/api/auth/passkeys app/api/auth/password/route.ts app/api/auth/reauthenticate/route.ts app/api/auth/session/route.ts app/login/page.tsx app/passwort-zuruecksetzen/page.tsx components/app-shell.tsx components/fresh-authentication-dialog.tsx components/passkey-login.tsx components/passkey-settings.tsx components/passkey-setup-offer.tsx components/security-settings-page.tsx database/migrations/0108_passkey_assurance.sql database/schema-contract.json docs/current-state.md docs/architecture/passkeys-20261027 docs/audit/v24/page-matrix.json docs/architecture/v26-route-additions.json docs/architecture/ux-inventory.json docs/architecture/routes.md docs/architecture/v21-5-integration-inventory.json docs/architecture/v21-5-routes.md lib/client/passkeys.ts lib/client/data-events.ts lib/locales/messages.json lib/locales/generated lib/server/env.ts lib/server/passkeys.ts lib/server/security-notice.ts lib/server/session.ts lib/server/totp.ts scripts/auth-integrity-test.mjs scripts/client-session-test.mjs scripts/passkey-test.mjs scripts/passkey-browser-test.mjs scripts/passkey-delivery.ps1
Assert-Result 'Stage reviewed paths'
git diff --cached --quiet
if($LASTEXITCODE -eq 1){git commit -m $CommitMessage;Assert-Result 'Commit'}elseif($LASTEXITCODE -ne 0){throw 'Cannot inspect staged changes'}
git ls-remote --exit-code --heads origin $branch
if($LASTEXITCODE -eq 0){git pull --rebase origin $branch;Assert-Result 'Pull with rebase'}elseif($LASTEXITCODE -ne 2){throw 'Cannot check remote branch'}
git push -u origin $branch
Assert-Result 'Push'
gh pr list --repo oemercam/binso_admin_azure --head $branch
Assert-Result 'Pull request status'
gh run list --repo oemercam/binso_admin_azure --branch $branch --limit 10
Assert-Result 'GitHub Actions status'
gh workflow view deploy-azure.yml --repo oemercam/binso_admin_azure
Assert-Result 'Azure pipeline definition'
Write-Output 'Review the exact commit and all required GitHub checks. Merge, full release qualification and Azure deployment still require the existing exact-SHA authorization.'
