# package-addon.ps1
# Empaqueta el addon en un archivo .mcaddon listo para distribuir

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectDir = Split-Path -Parent $scriptDir
$distDir = Join-Path $projectDir "dist"
$version = "1.0.0"
$outputName = "mi-addon-v$version.mcaddon"

Write-Host ""
Write-Host "=== Empaquetando Mi Addon ===" -ForegroundColor Cyan
Write-Host ""

# Crear carpeta dist si no existe
if (-not (Test-Path $distDir)) {
    New-Item -ItemType Directory -Path $distDir | Out-Null
    Write-Host "[OK] Carpeta dist/ creada" -ForegroundColor Green
}

$tempDir = Join-Path $distDir "temp_addon"
$zipPath = Join-Path $distDir "mi-addon-v$version.zip"
$mcaddonPath = Join-Path $distDir $outputName

# Limpiar archivos anteriores
if (Test-Path $tempDir) { Remove-Item -Recurse -Force $tempDir }
if (Test-Path $zipPath) { Remove-Item -Force $zipPath }
if (Test-Path $mcaddonPath) { Remove-Item -Force $mcaddonPath }

# Copiar packs a carpeta temporal
New-Item -ItemType Directory -Path $tempDir | Out-Null
Copy-Item -Recurse -Force (Join-Path $projectDir "behavior_pack") (Join-Path $tempDir "behavior_pack")
Copy-Item -Recurse -Force (Join-Path $projectDir "resource_pack") (Join-Path $tempDir "resource_pack")

# Eliminar archivos .gitkeep de la copia
Get-ChildItem -Path $tempDir -Recurse -Filter ".gitkeep" | Remove-Item -Force

Write-Host "[OK] Archivos preparados" -ForegroundColor Green

# Comprimir
Compress-Archive -Path "$tempDir\*" -DestinationPath $zipPath
Write-Host "[OK] Archivo ZIP creado" -ForegroundColor Green

# Renombrar a .mcaddon
Rename-Item -Path $zipPath -NewName $outputName
Write-Host "[OK] Renombrado a .mcaddon" -ForegroundColor Green

# Limpiar temporal
Remove-Item -Recurse -Force $tempDir

Write-Host ""
Write-Host "=== Empaquetado completado ===" -ForegroundColor Green
Write-Host ""
Write-Host "Archivo generado:" -ForegroundColor Yellow
Write-Host "  $mcaddonPath" -ForegroundColor White
Write-Host ""
Write-Host "Como importar en Minecraft:" -ForegroundColor Yellow
Write-Host "  OPCION 1 - PC: Doble clic en el archivo .mcaddon" -ForegroundColor White
Write-Host "  OPCION 2 - Xbox via OneDrive:"
Write-Host "    1. Sube el .mcaddon a OneDrive"
Write-Host "    2. En Xbox: app Archivos > OneDrive > descarga el archivo"
Write-Host "    3. Abre Minecraft > el addon se importa automaticamente"
Write-Host "  OPCION 3 - Xbox via USB:"
Write-Host "    1. Copia el .mcaddon a un USB (formato FAT32)"
Write-Host "    2. Conecta el USB al Xbox"
Write-Host "    3. En Minecraft Xbox: Configuracion > Almacenamiento > Importar"
Write-Host ""
