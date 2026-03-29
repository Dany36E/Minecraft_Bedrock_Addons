# deploy-to-minecraft.ps1
# Despliega el addon a la carpeta de desarrollo de Minecraft Bedrock en Windows

$ErrorActionPreference = "Stop"

# Buscar la carpeta de Minecraft (puede variar mayusculas/minusculas)
$packagesDir = "$env:LOCALAPPDATA\Packages"
$mcFolder = Get-ChildItem $packagesDir -Directory -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "MinecraftUWP_8wekyb3d8bbwe$" } |
    Select-Object -First 1

if (-not $mcFolder) {
    Write-Host ""
    Write-Host "ERROR: No se encontro Minecraft Bedrock instalado en este PC." -ForegroundColor Red
    Write-Host "Ruta esperada: $packagesDir\*MinecraftUWP_8wekyb3d8bbwe" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Posibles causas:" -ForegroundColor Yellow
    Write-Host "  - Minecraft Bedrock (Windows 10/11 Edition) no esta instalado"
    Write-Host "  - La ruta de instalacion cambio en una actualizacion"
    Write-Host "  - Estas usando la version Java (necesitas Bedrock)"
    Write-Host ""
    exit 1
}

$minecraftPath = Join-Path $mcFolder.FullName "LocalState\games\com.mojang"

if (-not (Test-Path $minecraftPath)) {
    Write-Host ""
    Write-Host "AVISO: Minecraft esta instalado pero la carpeta com.mojang no existe." -ForegroundColor Yellow
    Write-Host "Esto significa que nunca has abierto Minecraft en este PC." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Solucion:" -ForegroundColor Cyan
    Write-Host "  1. Abre Minecraft Bedrock una vez"
    Write-Host "  2. Espera a que cargue la pantalla principal"
    Write-Host "  3. Cierra Minecraft"
    Write-Host "  4. Vuelve a ejecutar este script"
    Write-Host ""
    Write-Host "Creando la estructura de carpetas manualmente..." -ForegroundColor Cyan
    New-Item -ItemType Directory -Path "$minecraftPath\development_behavior_packs" -Force | Out-Null
    New-Item -ItemType Directory -Path "$minecraftPath\development_resource_packs" -Force | Out-Null
    Write-Host "[OK] Carpetas creadas en: $minecraftPath" -ForegroundColor Green
    Write-Host ""
}

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir

$bpSource = Join-Path $projectDir "behavior_pack"
$rpSource = Join-Path $projectDir "resource_pack"

$bpDest = Join-Path $minecraftPath "development_behavior_packs\MiAddon_BP"
$rpDest = Join-Path $minecraftPath "development_resource_packs\MiAddon_RP"

Write-Host ""
Write-Host "=== Desplegando Mi Addon a Minecraft ===" -ForegroundColor Cyan
Write-Host ""

# Copiar Behavior Pack
if (Test-Path $bpDest) {
    Remove-Item -Recurse -Force $bpDest
}
Copy-Item -Recurse -Force $bpSource $bpDest
Write-Host "[OK] Behavior Pack copiado a:" -ForegroundColor Green
Write-Host "     $bpDest" -ForegroundColor Gray

# Copiar Resource Pack
if (Test-Path $rpDest) {
    Remove-Item -Recurse -Force $rpDest
}
Copy-Item -Recurse -Force $rpSource $rpDest
Write-Host "[OK] Resource Pack copiado a:" -ForegroundColor Green
Write-Host "     $rpDest" -ForegroundColor Gray

Write-Host ""
Write-Host "=== Deploy completado ===" -ForegroundColor Green
Write-Host ""
Write-Host "Siguiente paso:" -ForegroundColor Yellow
Write-Host "  1. Abre Minecraft Bedrock en tu PC"
Write-Host "  2. Crea un mundo nuevo o edita uno existente"
Write-Host "  3. Ve a 'Behavior Packs' y activa 'Mi Addon - Behavior Pack'"
Write-Host "  4. Ve a 'Resource Packs' y activa 'Mi Addon - Resource Pack'"
Write-Host "  5. Juega y prueba tu addon"
Write-Host ""
Write-Host "Para recargar cambios: sal del mundo y vuelve a entrar" -ForegroundColor Cyan
Write-Host ""
