#!/bin/bash

# Script para administrar el túnel cloudflared de PostgreSQL

TUNNEL_LOG="/tmp/cloudflared-postgres.log"
TUNNEL_PID_FILE="/tmp/cloudflared-postgres.pid"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

function show_status() {
    echo -e "${YELLOW}=== Estado del Túnel PostgreSQL ===${NC}"
    
    # Verificar si el proceso está corriendo
    if pgrep -f "cloudflared tunnel.*5432" > /dev/null; then
        PID=$(pgrep -f "cloudflared tunnel.*5432")
        echo -e "${GREEN}✓${NC} Túnel activo (PID: $PID)"
        
        # Obtener URL del túnel
        if [ -f "$TUNNEL_LOG" ]; then
            URL=$(grep "Your quick Tunnel has been created" "$TUNNEL_LOG" -A 1 | grep "https://" | sed 's/.*https:\/\//https:\/\//' | sed 's/|.*//' | xargs)
            if [ ! -z "$URL" ]; then
                echo -e "${GREEN}✓${NC} URL: $URL"
                HOSTNAME=$(echo $URL | sed 's/https:\/\///')
                echo ""
                echo "Para conectarte desde tu computadora local, ejecuta:"
                echo "  cloudflared access tcp --hostname $HOSTNAME --url localhost:5432"
            fi
        fi
    else
        echo -e "${RED}✗${NC} Túnel no está corriendo"
    fi
    
    # Verificar PostgreSQL
    echo ""
    echo -e "${YELLOW}=== Estado de PostgreSQL ===${NC}"
    if pgrep postgres > /dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL activo"
        
        # Verificar listen_addresses
        LISTEN=$(sudo -u postgres psql -t -c "SHOW listen_addresses;" 2>/dev/null | xargs)
        echo -e "${GREEN}✓${NC} Listen addresses: $LISTEN"
    else
        echo -e "${RED}✗${NC} PostgreSQL no está corriendo"
    fi
}

function start_tunnel() {
    echo -e "${YELLOW}=== Iniciando Túnel PostgreSQL ===${NC}"
    
    # Verificar si ya está corriendo
    if pgrep -f "cloudflared tunnel.*5432" > /dev/null; then
        echo -e "${YELLOW}⚠${NC} El túnel ya está corriendo"
        show_status
        return 0
    fi
    
    # Verificar que PostgreSQL esté corriendo
    if ! pgrep postgres > /dev/null; then
        echo -e "${RED}✗${NC} PostgreSQL no está corriendo. Inicia PostgreSQL primero."
        return 1
    fi
    
    # Iniciar túnel
    echo "Iniciando cloudflared..."
    nohup cloudflared tunnel --url tcp://localhost:5432 > "$TUNNEL_LOG" 2>&1 &
    echo $! > "$TUNNEL_PID_FILE"
    
    # Esperar a que el túnel se establezca
    echo "Esperando a que el túnel se establezca..."
    sleep 5
    
    # Verificar que se haya iniciado correctamente
    if pgrep -f "cloudflared tunnel.*5432" > /dev/null; then
        echo -e "${GREEN}✓${NC} Túnel iniciado correctamente"
        show_status
    else
        echo -e "${RED}✗${NC} Error al iniciar el túnel. Verifica el log:"
        echo "  tail -f $TUNNEL_LOG"
        return 1
    fi
}

function stop_tunnel() {
    echo -e "${YELLOW}=== Deteniendo Túnel PostgreSQL ===${NC}"
    
    # Buscar y matar el proceso
    PID=$(pgrep -f "cloudflared tunnel.*5432")
    if [ ! -z "$PID" ]; then
        echo "Deteniendo proceso $PID..."
        kill $PID
        sleep 2
        
        # Verificar que se detuvo
        if ! pgrep -f "cloudflared tunnel.*5432" > /dev/null; then
            echo -e "${GREEN}✓${NC} Túnel detenido correctamente"
            rm -f "$TUNNEL_PID_FILE"
        else
            echo -e "${YELLOW}⚠${NC} Forzando detención..."
            kill -9 $PID
            rm -f "$TUNNEL_PID_FILE"
            echo -e "${GREEN}✓${NC} Túnel detenido"
        fi
    else
        echo -e "${YELLOW}⚠${NC} El túnel no está corriendo"
    fi
}

function restart_tunnel() {
    echo -e "${YELLOW}=== Reiniciando Túnel PostgreSQL ===${NC}"
    stop_tunnel
    sleep 2
    start_tunnel
}

function show_url() {
    if [ -f "$TUNNEL_LOG" ]; then
        URL=$(grep "Your quick Tunnel has been created" "$TUNNEL_LOG" -A 1 | grep "https://" | sed 's/.*https:\/\//https:\/\//' | sed 's/|.*//' | xargs)
        if [ ! -z "$URL" ]; then
            HOSTNAME=$(echo $URL | sed 's/https:\/\///')
            echo -e "${GREEN}URL del túnel:${NC} $URL"
            echo ""
            echo -e "${YELLOW}Para conectarte desde tu computadora local:${NC}"
            echo "  cloudflared access tcp --hostname $HOSTNAME --url localhost:5432"
            echo ""
            echo -e "${YELLOW}Credenciales:${NC}"
            echo "  Host:     localhost"
            echo "  Port:     5432"
            echo "  Database: HAS"
            echo "  User:     postgres"
            echo "  Password: adminadmin"
        else
            echo -e "${RED}No se pudo obtener la URL del túnel${NC}"
        fi
    else
        echo -e "${RED}Log del túnel no encontrado. ¿Está el túnel corriendo?${NC}"
    fi
}

function show_logs() {
    if [ -f "$TUNNEL_LOG" ]; then
        echo -e "${YELLOW}=== Últimas 20 líneas del log ===${NC}"
        tail -20 "$TUNNEL_LOG"
        echo ""
        echo "Para ver el log completo: cat $TUNNEL_LOG"
        echo "Para ver el log en tiempo real: tail -f $TUNNEL_LOG"
    else
        echo -e "${RED}Log no encontrado${NC}"
    fi
}

function show_help() {
    echo "Administrador del Túnel CloudFlare para PostgreSQL"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos:"
    echo "  start    - Iniciar el túnel"
    echo "  stop     - Detener el túnel"
    echo "  restart  - Reiniciar el túnel"
    echo "  status   - Ver el estado del túnel y PostgreSQL"
    echo "  url      - Mostrar la URL del túnel y credenciales"
    echo "  logs     - Ver los últimos logs del túnel"
    echo "  help     - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start    # Iniciar el túnel"
    echo "  $0 status   # Ver el estado"
    echo "  $0 url      # Ver la URL y credenciales"
}

# Main
case "$1" in
    start)
        start_tunnel
        ;;
    stop)
        stop_tunnel
        ;;
    restart)
        restart_tunnel
        ;;
    status)
        show_status
        ;;
    url)
        show_url
        ;;
    logs)
        show_logs
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
