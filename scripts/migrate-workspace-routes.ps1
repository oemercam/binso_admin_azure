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

Write-Host "Workspace route migration cleanup complete."
