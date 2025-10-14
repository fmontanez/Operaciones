# 🛠️ Scripts de Administración - HAS Application

Esta carpeta contiene scripts útiles para administrar la aplicación HAS y sus servicios.

---

## 📜 Scripts Disponibles

### 1. `manage-postgres-tunnel.sh`

Script para administrar el túnel CloudFlare de PostgreSQL.

#### Uso:

```bash
./scripts/manage-postgres-tunnel.sh [comando]
```

#### Comandos Disponibles:

| Comando | Descripción |
|---------|-------------|
| `start` | Iniciar el túnel CloudFlare para PostgreSQL |
| `stop` | Detener el túnel |
| `restart` | Reiniciar el túnel |
| `status` | Ver el estado del túnel y PostgreSQL |
| `url` | Mostrar la URL del túnel y credenciales de conexión |
| `logs` | Ver los últimos logs del túnel |
| `help` | Mostrar ayuda |

#### Ejemplos:

```bash
# Iniciar el túnel
./scripts/manage-postgres-tunnel.sh start

# Ver el estado
./scripts/manage-postgres-tunnel.sh status

# Obtener la URL y credenciales
./scripts/manage-postgres-tunnel.sh url

# Ver los logs
./scripts/manage-postgres-tunnel.sh logs

# Detener el túnel
./scripts/manage-postgres-tunnel.sh stop

# Reiniciar el túnel
./scripts/manage-postgres-tunnel.sh restart
```

#### Output de Ejemplo:

```bash
$ ./scripts/manage-postgres-tunnel.sh status

=== Estado del Túnel PostgreSQL ===
✓ Túnel activo (PID: 4849)
✓ URL: https://watches-blackberry-sperm-nancy.trycloudflare.com

Para conectarte desde tu computadora local, ejecuta:
  cloudflared access tcp --hostname watches-blackberry-sperm-nancy.trycloudflare.com --url localhost:5432

=== Estado de PostgreSQL ===
✓ PostgreSQL activo
✓ Listen addresses: *
```

---

## 🔧 Requisitos

### Para `manage-postgres-tunnel.sh`:
- `cloudflared` instalado
- PostgreSQL corriendo
- Permisos de ejecución en el script

---

## 📝 Notas

### Permisos
Todos los scripts ya tienen permisos de ejecución configurados. Si necesitas reconfigurarlos:

```bash
chmod +x scripts/*.sh
```

### Logs
Los scripts generan logs en `/tmp/`:
- Túnel PostgreSQL: `/tmp/cloudflared-postgres.log`

### Variables de Entorno
No se requieren variables de entorno especiales para estos scripts.

---

## 🚀 Inicio Rápido

Para poner en marcha el túnel de PostgreSQL:

```bash
# 1. Asegúrate de que PostgreSQL esté corriendo
ps aux | grep postgres

# 2. Inicia el túnel
./scripts/manage-postgres-tunnel.sh start

# 3. Obtén la URL de conexión
./scripts/manage-postgres-tunnel.sh url

# 4. Usa la URL en tu cliente local para conectarte
```

---

## 🔄 Actualización Automática

Para hacer que el túnel se inicie automáticamente al arrancar el servidor, puedes agregar el script a crontab:

```bash
# Editar crontab
crontab -e

# Agregar esta línea (reemplaza la ruta si es necesario)
@reboot sleep 30 && /home/ubuntu/has-app-clean/scripts/manage-postgres-tunnel.sh start
```

---

## 📚 Documentación Relacionada

- **POSTGRESQL_CONNECTION_SUMMARY.md** - Resumen rápido de conexión
- **POSTGRESQL_REMOTE_CONNECTION_GUIDE.md** - Guía completa y detallada

---

## 🐛 Troubleshooting

### El script no tiene permisos de ejecución
```bash
chmod +x scripts/manage-postgres-tunnel.sh
```

### El túnel no inicia
1. Verifica que cloudflared esté instalado: `which cloudflared`
2. Verifica que PostgreSQL esté corriendo: `ps aux | grep postgres`
3. Revisa los logs: `./scripts/manage-postgres-tunnel.sh logs`

### No puedo ver la URL
1. Verifica que el túnel esté corriendo: `./scripts/manage-postgres-tunnel.sh status`
2. Si no está corriendo, inícialo: `./scripts/manage-postgres-tunnel.sh start`
3. Espera unos segundos y vuelve a intentar: `./scripts/manage-postgres-tunnel.sh url`

---

## 📞 Soporte

Para más información sobre la conexión remota a PostgreSQL, consulta:
- `POSTGRESQL_REMOTE_CONNECTION_GUIDE.md` - Guía completa
- `POSTGRESQL_CONNECTION_SUMMARY.md` - Resumen rápido

---

**Última actualización**: 12 de Octubre, 2025
