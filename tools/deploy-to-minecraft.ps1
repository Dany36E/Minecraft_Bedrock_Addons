# deploy-to-minecraft.ps1
# Despliega el addon a la carpeta de desarrollo de Minecraft Bedrock en Windows
# Ruta oficial: %APPDATA%\Minecraft Bedrock\Users\Shared\games\com.mojang
# Ref: https://learn.microsoft.com/en-us/minecraft/creator/documents/gettingstarted

$ErrorActionPreference = "Stop"

# Ruta nueva de Minecraft Bedrock (versiones recientes)
$minecraftPath = "$env:APPDATA\Minecraft Bedrock\Users\Shared\games\com.mojang"

# Fallback: ruta antigua UWP (versiones anteriores a 2024)
$legacyPath = $null
if (-not (Test-Path $minecraftPath)) {
    $packagesDir = "$env:LOCALAPPDATA\Packages"
    $mcFolder = Get-ChildItem $packagesDir -Directory -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "MinecraftUWP_8wekyb3d8bbwe$" } |
        Select-Object -First 1
    if ($mcFolder) {
        $legacyPath = Join-Path $mcFolder.FullName "LocalState\games\com.mojang"
        if (Test-Path "$legacyPath\minecraftWorlds") {
            $minecraftPath = $legacyPath
        }
    }
}

if (-not (Test-Path $minecraftPath)) {
    Write-Host ""
    Write-Host "ERROR: No se encontro la carpeta com.mojang de Minecraft Bedrock." -ForegroundColor Red
    Write-Host ""
    Write-Host "Rutas buscadas:" -ForegroundColor Yellow
    Write-Host "  Nueva: $env:APPDATA\Minecraft Bedrock\Users\Shared\games\com.mojang"
    if ($legacyPath) { Write-Host "  Legacy: $legacyPath" }
    Write-Host ""
    Write-Host "Solucion: Abre Minecraft Bedrock al menos una vez y vuelve a ejecutar." -ForegroundColor Cyan
    Write-Host ""
    exit 1
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
