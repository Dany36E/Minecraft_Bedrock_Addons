# deploy-to-minecraft.ps1
# Despliega el addon a TODAS las carpetas de Minecraft detectadas
# Soporta: ruta nueva (%APPDATA%) y UWP (%LOCALAPPDATA%)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$bpSource = Join-Path $projectDir "behavior_pack"
$rpSource = Join-Path $projectDir "resource_pack"

# Detectar todas las rutas de Minecraft
$paths = @()

# Ruta nueva (Minecraft Bedrock 2024+)
$newPath = "$env:APPDATA\Minecraft Bedrock\Users\Shared\games\com.mojang"
if (Test-Path $newPath) { $paths += @{name="Nueva"; path=$newPath} }

# Ruta UWP (Microsoft Store)
$uwpBase = "$env:LOCALAPPDATA\Packages"
$mcFolder = Get-ChildItem $uwpBase -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "MinecraftUWP_8wekyb3d8bbwe$" } |
    Select-Object -First 1
if ($mcFolder) {
    $uwpPath = Join-Path $mcFolder.FullName "LocalState\games\com.mojang"
    if (Test-Path $uwpPath) { $paths += @{name="UWP"; path=$uwpPath} }
}

if ($paths.Count -eq 0) {
    Write-Host "ERROR: No se encontro ninguna carpeta com.mojang de Minecraft." -ForegroundColor Red
    Write-Host "  Abre Minecraft al menos una vez y vuelve a ejecutar." -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "=== Desplegando Mi Addon a Minecraft ===" -ForegroundColor Cyan
Write-Host "  Rutas detectadas: $($paths.Count)" -ForegroundColor Gray
Write-Host ""

foreach ($target in $paths) {
    $bpDest = Join-Path $target.path "development_behavior_packs\MiAddon_BP"
    $rpDest = Join-Path $target.path "development_resource_packs\MiAddon_RP"

    if (Test-Path $bpDest) { Remove-Item -Recurse -Force $bpDest }
    Copy-Item -Recurse -Force $bpSource $bpDest

    if (Test-Path $rpDest) { Remove-Item -Recurse -Force $rpDest }
    Copy-Item -Recurse -Force $rpSource $rpDest

    Write-Host "[$($target.name)] Desplegado a:" -ForegroundColor Green
    Write-Host "     $($target.path)" -ForegroundColor Gray
}

Write-Host ""
Write-Host "=== Deploy completado ===" -ForegroundColor Green
Write-Host ""
Write-Host "Cierra Minecraft, abrelo de nuevo, y busca 'Mi Addon' en Behavior Packs." -ForegroundColor Yellow
Write-Host ""
