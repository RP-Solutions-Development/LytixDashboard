# 🐳 Docker Deployment Guide - Hostinger VPS

Guía completa para desplegar PPL Dashboard en Docker dentro de tu VPS de Hostinger.

---

## 📋 Requisitos

- VPS Hostinger con acceso root/sudo
- Docker instalado
- Docker Compose instalado
- Acceso a repositorio GitHub
- Credenciales de SQL Server en otro VPS

---

## 🚀 Paso 1: Preparar el VPS

### 1.1 Conectarse al VPS
```bash
ssh root@tu_ip_vps
```

### 1.2 Actualizar sistema
```bash
apt update && apt upgrade -y
```

### 1.3 Instalar Docker y Docker Compose
```bash
# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Instalar Docker Compose (si no está incluido)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker --version
docker-compose --version
```

### 1.4 Crear usuario para Docker (opcional pero recomendado)
```bash
sudo groupadd docker
sudo usermod -aG docker $USER
newgrp docker
```

---

## 📁 Paso 2: Clonar el Repositorio

```bash
# Crear directorio del proyecto
mkdir -p /opt/ppl-dashboard
cd /opt/ppl-dashboard

# Clonar repositorio
git clone https://github.com/RP-Solutions-Development/LytixDashboard.git .

# Cambiar a rama dev (donde está el código actualizado)
git checkout dev
```

---

## 🔧 Paso 3: Configurar Variables de Entorno

### 3.1 Crear archivo .env.local en el VPS
```bash
cat > .env.local << 'EOF'
# SQL Server Connection (obtener del equipo de BD)
SQLSERVER_HOST=2.25.101.200
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=leads
SQLSERVER_USER=leads_dashboard_app
SQLSERVER_PASSWORD=Ld9!abe865f3029f47ffb547b5fdfb950905xQ
SQLSERVER_ENCRYPT=false
SQLSERVER_TRUST_SERVER_CERTIFICATE=true
SQLSERVER_POOL_MAX=20

# Authentication Configuration
AUTH_SESSION_HOURS=12
AUTH_RATE_WINDOW_MINUTES=15
AUTH_EMAIL_FAILURE_LIMIT=5
AUTH_IP_FAILURE_LIMIT=20
AUTH_COOKIE_SECURE=true

# Node environment
NODE_ENV=production
EOF
```

### 3.2 ⚠️ Proteger el archivo .env.local
```bash
chmod 600 .env.local
ls -la .env.local
```

> **IMPORTANTE:** Este archivo contiene credenciales. Nunca lo comittees a GitHub.

---

## 🐳 Paso 4: Construir y Ejecutar Docker

### 4.1 Opción A: Usando Docker Compose (Recomendado)

```bash
# Construir imagen
docker-compose build

# Iniciar servicios (app + nginx)
docker-compose up -d

# Ver logs
docker-compose logs -f ppl-dashboard

# Verificar estado
docker-compose ps
```

### 4.2 Opción B: Docker manual

```bash
# Construir imagen
docker build -t ppl-dashboard:latest .

# Ejecutar contenedor
docker run -d \
  --name ppl-dashboard \
  --restart unless-stopped \
  -p 3000:3000 \
  --env-file .env.local \
  ppl-dashboard:latest

# Ver logs
docker logs -f ppl-dashboard

# Verificar estado
docker ps
```

---

## ✅ Paso 5: Verificar Instalación

### 5.1 Prueba de conectividad
```bash
# Desde el VPS
curl -I http://localhost:3000/login

# Desde tu máquina local
curl -I http://tu_ip_vps:3000/login
```

### 5.2 Verificar logs
```bash
docker-compose logs ppl-dashboard
# o
docker logs ppl-dashboard
```

### 5.3 Acceder a la aplicación
```
http://tu_ip_vps:3000/login
```

**Credenciales de prueba:**
- Email: admin@test.com
- Password: test

---

## 🌐 Paso 6: Configurar Dominio y SSL (Opcional)

### 6.1 Actualizar nginx.conf
Edita `nginx.conf` y descomentar la sección HTTPS:

```bash
nano nginx.conf
```

Busca y descomenta:
```nginx
server {
    listen 443 ssl http2;
    server_name dashboard.rpsolutions.io;
    ...
}
```

### 6.2 Obtener certificado SSL con Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generar certificado
sudo certbot certonly --standalone -d dashboard.rpsolutions.io

# Los certificados estarán en:
# /etc/letsencrypt/live/dashboard.rpsolutions.io/
```

### 6.3 Copiar certificados
```bash
sudo cp /etc/letsencrypt/live/dashboard.rpsolutions.io/fullchain.pem ./certs/
sudo cp /etc/letsencrypt/live/dashboard.rpsolutions.io/privkey.pem ./certs/
sudo chown $USER:$USER ./certs/*
```

### 6.4 Reiniciar nginx
```bash
docker-compose restart nginx
# o
docker restart ppl-dashboard-nginx
```

---

## 🔄 Paso 7: GitHub Auto-Sync (Webhook)

### 7.1 Crear script de pull automático
```bash
cat > /opt/ppl-dashboard/update.sh << 'EOF'
#!/bin/bash
cd /opt/ppl-dashboard
git fetch origin
git reset --hard origin/dev
docker-compose build
docker-compose up -d
docker-compose logs ppl-dashboard
EOF

chmod +x /opt/ppl-dashboard/update.sh
```

### 7.2 Configurar webhook en GitHub
1. Ve a tu repo: https://github.com/RP-Solutions-Development/LytixDashboard
2. Settings → Webhooks → Add webhook
3. Payload URL: `http://tu_ip_vps:9000/webhook` (necesita servicio webhook)
4. Events: Push events
5. Active: ✓

---

## 📊 Comandos Útiles

### Ver logs en tiempo real
```bash
docker-compose logs -f ppl-dashboard
```

### Ver estado de contenedores
```bash
docker-compose ps
```

### Detener la aplicación
```bash
docker-compose down
```

### Reiniciar la aplicación
```bash
docker-compose restart ppl-dashboard
```

### Reconstruir imagen (después de cambios en código)
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Limpiar espacio (eliminar imágenes/volúmenes no usados)
```bash
docker system prune -a --volumes
```

### Ejecutar comandos dentro del contenedor
```bash
docker-compose exec ppl-dashboard npm run build
```

### Ver recursos usados
```bash
docker stats ppl-dashboard
```

---

## 🔒 Seguridad

### Firewall (UFW)
```bash
# Permitir SSH
sudo ufw allow 22/tcp

# Permitir HTTP
sudo ufw allow 80/tcp

# Permitir HTTPS
sudo ufw allow 443/tcp

# Denegar todo lo demás
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw enable
```

### Limitar acceso a SQL Server
En el VPS de SQL Server, restringir puerto 1433 solo a la IP de Hostinger:
```sql
-- En SQL Server
-- Configurar firewall para permitir solo la IP del VPS de Hostinger
```

### Backups
```bash
# Crear backup del .env.local
cp .env.local .env.local.backup
chmod 600 .env.local.backup

# Guardar en lugar seguro (no en Git)
```

---

## 🚨 Troubleshooting

### "Connection refused" a SQL Server
```bash
# Verificar conectividad
docker-compose exec ppl-dashboard curl telnet://2.25.101.200:1433

# Ver logs de conexión
docker-compose logs ppl-dashboard | grep -i error
```

### Puerto 3000 ya en uso
```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "3001:3000"  # Mapear a puerto diferente
```

### Salir del modo de baja memoria
```bash
# Aumentar espacio swap
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Certificado SSL expirado
```bash
# Renovar automáticamente (Let's Encrypt)
sudo certbot renew --dry-run
sudo systemctl start certbot.timer
```

---

## 📈 Monitoreo

### Agregar contenedor de monitoreo (opcional)
```yaml
# Agregar a docker-compose.yml
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
```

---

## 🔄 Actualizar aplicación desde GitHub

```bash
# Opción 1: Manual
cd /opt/ppl-dashboard
git pull origin dev
docker-compose build
docker-compose up -d

# Opción 2: Script automático
./update.sh
```

---

## 📞 Soporte

Si tienes problemas:

1. Revisa los logs: `docker-compose logs ppl-dashboard`
2. Verifica conectividad a SQL Server
3. Asegúrate que .env.local tiene credenciales correctas
4. Verifica firewall del VPS

---

**Status:** ✅ Ready for Production  
**Versión:** 2026-09-11  
**Repository:** RP-Solutions-Development/LytixDashboard
