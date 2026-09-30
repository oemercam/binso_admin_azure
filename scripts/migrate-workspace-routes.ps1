$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$appRoot = Join-Path $projectRoot "app"

$workspaceRoutes = @(
    "abo",
    "abwesenheiten",
    "aufgaben",
    "auftraege",
    "bank",
    "benachrichtigungen",
    "berichte",
    "buchhaltung",
    "dashboard",
    "dokumente",
    "eingangsrechnungen",
    "einstellungen",
    "feedback",
    "kunden",
    "lieferanten",
    "lohn",
    "mwst",
    "neuigkeiten",
    "offerten",
    "personal",
    "produkte",
    "projekte",
    "rechnungen",
    "spesen",
    "support",
    "vertraege",
    "zahlungen",
    "zeiterfassung"
)

foreach ($route in $workspaceRoutes) {
    $legacyPath = Join-Path $appRoot $route
    $workspacePath = Join-Path (Join-Path $appRoot "(workspace)") $route

    if ((Test-Path $legacyPath) -and (Test-Path $workspacePath)) {
        Write-Host "Removing duplicate legacy route: app/$route"
        Remove-Item $legacyPath -Recurse -Force
    }
}


$obsoleteFiles = @(
    "components\app-boot-loader.tsx",
    "components\marketing-features.tsx",
    "components\marketing-pricing.tsx",
    "lib\data.ts"
)

foreach ($relativePath in $obsoleteFiles) {
    $obsoletePath = Join-Path $projectRoot $relativePath
    if (Test-Path $obsoletePath) {
        Write-Host "Removing obsolete file: $relativePath"
        Remove-Item $obsoletePath -Force
    }
}

Write-Host "Workspace route and obsolete-file cleanup complete."
