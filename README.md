# Mi Addon — Minecraft Bedrock Add-on

Add-on para Minecraft Bedrock Edition compatible con **Xbox** y **Windows 10/11**.

## Requisitos Previos

- [Node.js](https://nodejs.org/) (LTS)
- [Git](https://git-scm.com/)
- [VS Code](https://code.visualstudio.com/) con las extensiones:
  - `Blockception.minecraft-bedrock-development`
  - `ms-vscode.vscode-json`
  - `esbenp.prettier-vscode`
  - `GitHub.copilot`
  - `GitHub.copilot-chat`
- Minecraft Bedrock Edition (Windows 10/11) para testing

## Estructura del Proyecto

```
mi-addon/
├── behavior_pack/     ← Lógica: entidades, items, bloques, loot tables, scripts
│   ├── manifest.json
│   ├── pack_icon.png
│   ├── entities/
│   ├── items/
│   ├── blocks/
│   ├── loot_tables/
│   └── scripts/
├── resource_pack/     ← Visual: texturas, modelos, animaciones, traducciones
│   ├── manifest.json
│   ├── pack_icon.png
│   ├── textures/
│   ├── models/
│   ├── animations/
│   ├── render_controllers/
│   └── texts/
└── tools/             ← Scripts de utilidad
    ├── deploy-to-minecraft.ps1
    ├── package-addon.ps1
    └── package-addon.sh
```

## Testing en PC (Desarrollo)

### Desplegar a Minecraft

Ejecuta el script de deploy para copiar automáticamente los packs a la carpeta de desarrollo de Minecraft:

```powershell
.\tools\deploy-to-minecraft.ps1
```

Esto copia los packs a:
- `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\MiAddon_BP`
- `%LOCALAPPDATA%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_resource_packs\MiAddon_RP`

### Activar el Addon en Minecraft PC

1. Abre Minecraft Bedrock en tu PC
2. Crea un mundo nuevo (o edita uno existente)
3. Ve a **Behavior Packs** → Activa **"Mi Addon - Behavior Pack"**
4. Ve a **Resource Packs** → Activa **"Mi Addon - Resource Pack"**
5. **Juega y prueba**

### Recargar cambios

Cada vez que hagas cambios:
1. Ejecuta `.\tools\deploy-to-minecraft.ps1`
2. En Minecraft: sal del mundo y vuelve a entrar (los packs se recargan)

## Empaquetar el Addon

### Windows (PowerShell)

```powershell
.\tools\package-addon.ps1
```

### Mac/Linux (Bash)

```bash
chmod +x tools/package-addon.sh
./tools/package-addon.sh
```

Esto genera `dist/mi-addon-v1.0.0.mcaddon` listo para distribuir.

## Pasar el Addon a Xbox (SIN Realm — GRATIS)

### Método 1 — LAN Local (el más rápido para desarrollo)

> **Recomendado para desarrollo activo.** Cambios en PC se prueban en Xbox casi en tiempo real.

1. Abre Minecraft en tu **PC** con un mundo que tenga el addon activo
2. Asegúrate de que el mundo esté configurado como **"Visible para jugadores en LAN"**
3. En **Xbox**: ve a **Jugar → Amigos → Mundos en LAN visibles**
4. Ambos dispositivos deben estar conectados al **mismo WiFi/red**
5. Únete al mundo desde Xbox — **el addon carga automáticamente**

**Ventajas:**
- Gratis
- Los cambios que hagas en PC y redespliegues se reflejan al reconectarte desde Xbox
- No necesitas exportar/importar archivos
- Perfecto para ciclo de desarrollo rápido

### Método 2 — Archivo .mcworld por OneDrive (GRATIS)

> Ideal para compartir el mundo completo con el addon ya incluido.

1. En Minecraft PC: ve al mundo → **Editar** → **Exportar Mundo** (genera `.mcworld`)
2. Sube el archivo `.mcworld` a **OneDrive** (cuenta gratuita funciona)
3. En Xbox: abre la app **"Archivos"** (Files) → **OneDrive** → descarga el `.mcworld`
4. El archivo se abre automáticamente con Minecraft y se importa el mundo con el addon

### Método 3 — USB (GRATIS)

> Para cuando no tienes buena conexión a internet.

1. Empaqueta el addon: `.\tools\package-addon.ps1`
2. En Minecraft PC: exporta el mundo como `.mcworld`
3. Copia el archivo `.mcworld` a un **USB formateado en FAT32**
4. Conecta el USB al Xbox
5. En Minecraft Xbox: el mundo aparecerá disponible para importar

> **Nota:** El formato FAT32 tiene un límite de 4 GB por archivo. Si tu mundo es más grande, usa el Método 2.

## UUIDs del Proyecto

Estos son los UUIDs únicos de este addon (NO cambiarlos):

| Descripción | UUID |
|---|---|
| BP Header | `e446079b-e60b-48f4-a9ae-65ebab1c410b` |
| BP Module | `001e52a2-1e89-4dd7-a169-29a208629b1d` |
| RP Header | `aaf37a1e-4488-450a-a4f1-330f28740046` |
| RP Module | `2711d455-df19-44ea-8ca8-25fc325e64cf` |

## Convenciones

- **Namespace:** `miaddon:` (ej: `miaddon:mi_espada`, `miaddon:mob_custom`)
- **Archivos:** siempre `snake_case`
- **Target:** Minecraft Bedrock 1.21.x
- **Plataformas:** Windows 10/11 + Xbox
