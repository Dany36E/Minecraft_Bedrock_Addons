# Minecraft Bedrock Add-on — Contexto para el Agente

## Proyecto
Estoy desarrollando un Add-on para Minecraft Bedrock Edition.
Target: Xbox + Windows. Versión Minecraft: 1.21.x
Namespace del proyecto: miaddon

## Estructura
- Behavior Pack: ./behavior_pack/
- Resource Pack: ./resource_pack/
- Plataforma: Bedrock (NO Java Edition — son completamente distintos)

## Reglas de código
- Siempre usar format_version correcto para cada tipo de archivo JSON
- Los UUIDs deben ser únicos — generar con crypto.randomUUID() o similar
- Nomenclatura de archivos: snake_case siempre
- Namespace prefix en todos los identificadores: miaddon:nombre_cosa
- Al crear entidades: incluir siempre component_groups y events
- Al crear items: definir en BP (lógica) Y en RP (textura)
- Al crear bloques: definir en BP Y registrar en RP/blocks.json
- Respetar exactamente la estructura de carpetas de Bedrock

## Formatos de archivos por versión 1.21
- Entidades BP: format_version "1.16.0"
- Entidades RP (client): format_version "1.10.0"
- Items: format_version "1.21.10"
- Bloques: format_version "1.21.10"
- Animaciones: format_version "1.10.0"
- Render Controllers: format_version "1.10.0"

## Workflow de testing
1. Editar en laptop
2. Correr tools/deploy-to-minecraft.ps1 para copiar automáticamente a la carpeta de desarrollo
3. Recargar chunks en Minecraft PC para testear
4. Cuando funcione: empaquetar y transferir a Xbox
