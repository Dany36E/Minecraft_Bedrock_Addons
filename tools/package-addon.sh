#!/bin/bash
# package-addon.sh
# Empaqueta el addon en un archivo .mcaddon listo para distribuir

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
DIST_DIR="$PROJECT_DIR/dist"
VERSION="1.0.0"
OUTPUT_NAME="mi-addon-v$VERSION.mcaddon"

echo ""
echo "=== Empaquetando Mi Addon ==="
echo ""

# Crear carpeta dist si no existe
mkdir -p "$DIST_DIR"
echo "[OK] Carpeta dist/ lista"

TEMP_DIR="$DIST_DIR/temp_addon"
ZIP_PATH="$DIST_DIR/mi-addon-v$VERSION.zip"
MCADDON_PATH="$DIST_DIR/$OUTPUT_NAME"

# Limpiar archivos anteriores
rm -rf "$TEMP_DIR" "$ZIP_PATH" "$MCADDON_PATH"

# Copiar packs a carpeta temporal
mkdir -p "$TEMP_DIR"
cp -r "$PROJECT_DIR/behavior_pack" "$TEMP_DIR/behavior_pack"
cp -r "$PROJECT_DIR/resource_pack" "$TEMP_DIR/resource_pack"

# Eliminar archivos .gitkeep de la copia
find "$TEMP_DIR" -name ".gitkeep" -delete

echo "[OK] Archivos preparados"

# Comprimir
cd "$TEMP_DIR"
zip -r "$ZIP_PATH" behavior_pack resource_pack -q
cd "$PROJECT_DIR"
echo "[OK] Archivo ZIP creado"

# Renombrar a .mcaddon
mv "$ZIP_PATH" "$MCADDON_PATH"
echo "[OK] Renombrado a .mcaddon"

# Limpiar temporal
rm -rf "$TEMP_DIR"

echo ""
echo "=== Empaquetado completado ==="
echo ""
echo "Archivo generado:"
echo "  $MCADDON_PATH"
echo ""
echo "Como importar en Minecraft:"
echo "  OPCION 1 - PC: Doble clic en el archivo .mcaddon"
echo "  OPCION 2 - Movil: Abre el archivo con Minecraft"
echo "  OPCION 3 - Xbox via OneDrive:"
echo "    1. Sube el .mcaddon a OneDrive"
echo "    2. En Xbox: app Archivos > OneDrive > descarga el archivo"
echo "    3. Abre Minecraft > el addon se importa automaticamente"
echo ""
