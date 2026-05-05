# KigaBot - Bot de Moderación Discord

<div align="center">

![Discord](https://img.shields.io/discord/xxx?style=flat-square)
![Node](https://img.shields.io/node/v14.21.0?style=flat-square)
![License](https://img.shields.io/github/license/gonzalo2324-dev/kigabot?style=flat-square)

**Bot de moderación y protección contra raids para Discord**

Desarrollado por [Gonzalo2324](https://github.com/gonzalo2324-dev)

</div>

---

## 📋 Índice

1. [Características](#características)
2. [Requisitos](#requisitos)
3. [Instalación](#instalación)
4. [Configuración](#configuración)
5. [Comandos](#comandos)
6. [Funciones](#funciones)
7. [Sistema de Permisos](#sistema-de-permisos)
8. [Comando de Despliegue](#comando-de-despliegue)
9. [Soporte](#soporte)

---

## ✨ Características

### Protección Antiraid
- **Límites personalizables** por acción (crear/borrar canales, roles, emojis, ban, kick, etc.)
- **Cooldown configurable** para cada acción
- **Acciones punitivas automáticas** al superar límites
- **Monitoreo de bots** sospechoso

### Blacklist Global
- **Lista compartida** de usuarios maliciosos entre todos los servidores
- **Baneo automático** al entrada a nuevos servidores
- **Pending bans** (baneos pendientes)
- **Sincronización** entre servidores

### Sistema de Verificación
- **Verificación por código** con botones
- **Roles configurables** (verificado/no verificado)
- **Protección contra bots** automática

### Sistema Antispam
- **Límite de mensajes** configurable
- **Tiempo de reseteo** configurable
- **Aislamiento temporal** de usuarios

### Moderación
- Comandos básicos: ban, kick, clear
- Whitelist de usuarios y roles
- Logs de acceso
- Control de alertas

---

## 🔧 Requisitos

- **Node.js**: 14.x o superior
- **npm**: 6.x o superior
- **Discord Bot Token**: [Crear en Discord Developer Portal](https://discord.com/developers/applications)
- **Permisos del bot**:
  - Administrator (recomendado)
  - Ban Members
  - Kick Members
  - Manage Roles
  - Manage Channels
  - Send Messages
  - Read Messages

---

## 📦 Instalación

### 1. Clonar o descargar el proyecto

```bash
git clone https://github.com/gonzalo2324-dev/kigabot.git
cd kigabot
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el archivo .env

Edita el archivo `.env` con tu configuración:

```env
# Token del bot (de Discord Developer Portal)
TOKEN=tu_token_aqui

# Client ID del bot
CLIENT_ID=tu_client_id_aqui

# Nombre del bot
NOMBRE_BOT=NombreDeTuBot

# IDs de owners (separados por coma)
OWNERS=tu_user_id
OWNER_IDS=tu_user_id
```

### 4. Ejecutar el bot

```bash
npm start
```

O directamente:

```bash
node server.js
```

---

## ⚙️ Configuración

### Canales de alertas

```bash
/set-alert-channel #canal
```

Establece el canal donde se envían las alertas de seguridad.

### Canal de blacklist

```bash
/setblacklist-channel #canal
```

Establece el canal de logs de blacklist.

### Configurar antiraid

```bash
/antiraid
```

Muestra el menú interactivo para configurar límites.

### Configurar verificación

```bash
/verificacion @rol_no_verificado @rol_verificado #canal
```

---

## 📝 Comandos

### Dueño/Owner

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `/salirservidor` | Sale de un servidor | Por ID o selección |
| `/servers` | Lista servidores | Envía por DM |
| `/blacklistadd` | Añadir a blacklist | @usuario razón |
| `/blacklistremove` | Quitar de blacklist | @usuario |
| `/check` | Verificar configuración | Servidor actual |
| `/add-whitelist-user` | Whitelist usuario | @usuario |
| `/add-whitelist-role` | Whitelist rol | @rol |
| `/remove-whitelist-user` | Quitar whitelist | @usuario |
| `/remove-whitelist-role` | Quitar whitelist | @rol |

### Administración

| Comando | Descripción | Uso |
|---------|-------------|-----|
| `/ban` | BANEAR usuario | @usuario [razón] |
| `/kick` | Expulsar usuario | @usuario [razón] |
| `/clear` | Borrar mensajes | número |
| `/role` | Dar/quitar rol | @usuario @rol |
| `/say` | Mensaje como el bot | texto |
| `/antiraid` | Configurar antiraid | Interactivo |
| `/verificacion` | Configurar verificación | Ver arriba |
| `/set-alert-channel` | Canal de alertas | #canal |
| `/setblacklist-channel` | Canal blacklist | #canal |
| `/configurar-spam` | Configurar antispam | Opciones |
| `/monitorear-bots` | Configurar antim bots | enable/disable |
| `/vigilancia-personas` | Vigilancia usuarios | enable/disable |

### Información

| Comando | Descripción |
|---------|-------------|
| `/info-user` | Info de un usuario |
| `/estado-bot` | Estadísticas del bot |
| `/getantiraid` | Ver config antiraid |

---

## 🛡️ Funciones

### Sistema de Blacklist Global

El sistema de blacklist permite compartir usuarios maliciosos entre todos los servidores:

1. El owner añade usuario a blacklist con razón
2. El bot banea automáticamente al usuario en todos los servidores
3. Si el usuario intenta entrar a un servidor con el bot, se banea automáticamente

**Pending Bans**: Al añadir a blacklist, se puede选择 si se hace ban inmediatamente o se pending (esperando que entre al servidor).

### Protección Antiraid

El sistema antiraid limita acciones por miembro:

- **Límite**: Cantidad de acciones antes de sanción
- **Cooldown**: Tiempo en segundos para resetear el contador

Acciones configurables:
- Crear canales
- Eliminar canales
- Editar canales
- Crear roles
- Eliminar roles
- Crear emojis
- Eliminar emojis
- Kickear
- Banear
- Desbanear

### Sistema de Verificación

1. Usuario nuevo entra al servidor
2. Recibe el rol de "no verificado"
3. Debe pasar verificación con código
4. Al completar, recibe el rol de "verificado"

### Whitelist

Usuarios y roles en whitelist **ignoran** el antiraid y antispam. Útil para trustados bots o moderadores.

---

## 🔐 Sistema de Permisos

### Owner (Dueño)
- Acceso total al bot
- Puede usar comandos de owner
- Puede gestionar blacklist global

### Administradores del servidor
- Comandos de moderación
- Configuración del servidor

### Usuarios whitelist
- Ignoran límites antiraid
- Ignoran antispam

---

## 🚀 Comando de Despliegue

Para registrar los comandos de slash en Discord:

```bash
node deploy-commands.js
```

**Nota**: Necesitas tener el TOKEN y CLIENT_ID configurados en .env

---

## 📂 Estructura de Archivos

```
KigaBot/
├── commands/moderacion/    # Comandos
├── events/               # Eventos
├── components/          # Componentes UI
├── utils/               # Utilidades
├── data/               # Archivos JSON (datos)
├── server.js           # Archivo principal
├── deploy-commands.js  # Registro de comandos
├── .env               # Configuración
└── package.json       # Dependencias
```

---

## 📊 Archivos de Datos

Todos los datos se guardan en la carpeta `data/`:

| Archivo | Contenido |
|---------|-----------|
| `blacklist.json` | Usuarios bloqueados globalmente |
| `pendingBans.json` | Baneos pendientes |
| `whitelistData.json` | Usuarios/roles confianza |
| `alertConfig.json` | Canales de alertas |
| `blacklistChannel.json` | Canales blacklist |
| `verificacionConfig.json` | Config verificación |
| `antiraidLimits.json` | Límites antiraid |
| `spamConfig.json` | Config antispam |
| `antiBotConfig.json` | Config antim bots |
| `yelLimits.json` | Límites de acciones |
| `monitorearPersonasConfig.json` | Vigilancia |
| `ownerLog.json` | Log de owners |
| `ownerLog.json` | Log de owners |

---

## 🤝 Contribuir

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature-nueva`)
3. Commit tus cambios (`git commit -m 'Add feature'`)
4. Push a la rama (`git push origin feature-nueva`)
5. Abre un Pull Request

---

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

---

## 🆘 Soporte
- **Gmail**: gonzalogr599@gmail.com
- **GitHub**: [Reporta issues](https://github.com/gonzalo2324-dev/kigabot/issues)
- **GitHub**: https://github.com/gonzalo2324-dev

---

<div align="center">

**Desarrollado por [Gonzalo2324](https://github.com/gonzalo2324-dev)**

</div>
