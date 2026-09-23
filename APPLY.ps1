$ErrorActionPreference = "Stop"

$source = $PSScriptRoot
$target = "C:\binso\binso_admin_azure"

if (-not (Test-Path $target)) {
    throw "Zielordner nicht gefunden: $target"
}

Write-Host "Aktualisiere Binso Admin..."
Write-Host "Quelle: $source"
Write-Host "Ziel:   $target"

Get-ChildItem -Path $source -Force | Where-Object {
    $_.Name -notin @("APPLY.ps1", "README-UPDATE.txt")
} | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
}

Write-Host ""
Write-Host "Aktualisierung abgeschlossen."
Write-Host "Bestehende package-lock.json bleibt erhalten, sofern sie nicht im Paket enthalten ist."
Write-Host ""
Write-Host "Jetzt ausfuehren:"
Write-Host "  cd C:\binso\binso_admin_azure"
Write-Host "  npm run typecheck"
Write-Host "  npm run lint"
Write-Host "  npm run architecture:check"
Write-Host "  npm run build"
