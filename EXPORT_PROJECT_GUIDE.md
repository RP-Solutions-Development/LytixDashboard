# 📦 EXPORT: PPL Dashboard - Complete Setup Guide

**Fecha:** 2026-09-14  
**Status:** Production Ready ✅  
**Versión:** v1.0.0-VMP

---

## 📋 CONTENIDO DEL EXPORT

Este documento contiene TODOS los archivos, configuraciones y pasos para reproducir este proyecto en otro entorno.

### Archivos Clave Incluidos:

```
✅ package.json - Dependencias
✅ .env.example - Variables de entorno (sin credenciales)
✅ tsconfig.json - Configuración TypeScript
✅ next.config.ts - Configuración Next.js
✅ Dockerfile - Imagen Docker optimizada
✅ docker-compose.yml - Orquestación de servicios
✅ nginx.conf - Reverse proxy configurado
✅ .dockerignore - Optimización de imagen
```

### Documentación Incluida:

```
✅ README.md - Presentación general
✅ DOCKER_DEPLOYMENT.md - Guía deployment en Hostinger
✅ TESTING_GUIDE.md - Suite completa de testing
✅ AUDIT_REPORT_2026-09-11.md - Resultados de auditoría
✅ CLAUDE.md - Directrices para colaboración con IA
```

### Carpetas de Código:

```
app/          - Páginas Next.js 16 + API routes
lib/          - Lógica compartida (auth, BD, dashboard)
components/   - Componentes React reutilizables
public/       - Assets estáticos
scripts/      - Utilidades (crear usuario, tests)
```

---

## 🚀 PARA USAR EN OTRO PROYECTO

### Paso 1: Copiar archivos de base

```bash
# En tu nuevo proyecto
cp ppl-dashboard/Dockerfile .
cp ppl-dashboard/.dockerignore .
cp ppl-dashboard/docker-compose.yml .
cp ppl-dashboard/nginx.conf .
cp ppl-dashboard/next.config.ts .
cp ppl-dashboard/tsconfig.json .
cp -r ppl-dashboard/lib .
cp -r ppl-dashboard/scripts .
```

### Paso 2: Actualizar package.json

```json
{
  "name": "tu-nuevo-proyecto",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev --webpack",
    "build": "next build",
    "start": "next start",
    "lint": "eslint ."
  },
  "dependencies": {
    "next": "16.2.1",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "mssql": "^11.2.3",
    "@tanstack/react-query": "^5.51.23",
    "zustand": "^4.5.2",
    "next-intl": "^3.22.2"
  },
  "devDependencies": {
    "typescript": "^5.7.2",
    "@types/node": "^20.16.5",
    "@types/react": "^18.3.5",
    "tailwindcss": "^3.4.13",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "eslint": "^8.57.1",
    "@typescript-eslint/eslint-plugin": "^8.8.1"
  }
}
```

### Paso 3: Configurar .env.local

```bash
# Copiar template
cp .env.example .env.local

# Editar con tus credenciales
SQLSERVER_HOST=tu_sql_server_ip
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=tu_base_datos
SQLSERVER_USER=tu_usuario_sql
SQLSERVER_PASSWORD=tu_contraseña

AUTH_SESSION_HOURS=12
AUTH_RATE_WINDOW_MINUTES=15
AUTH_EMAIL_FAILURE_LIMIT=5
AUTH_COOKIE_SECURE=false  # true en producción
```

### Paso 4: Estructura de BD requerida

Las siguientes tablas DEBEN existir en SQL Server:

```sql
-- Usuarios
CREATE TABLE dbo.app_users (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  email NVARCHAR(255) UNIQUE NOT NULL,
  display_name NVARCHAR(255),
  password_hash NVARCHAR(MAX),
  role VARCHAR(50),
  is_active BIT DEFAULT 1,
  created_at DATETIMEOFFSET,
  updated_at DATETIMEOFFSET
);

-- Sesiones
CREATE TABLE dbo.app_sessions (
  id UNIQUEIDENTIFIER PRIMARY KEY,
  user_id UNIQUEIDENTIFIER FOREIGN KEY REFERENCES app_users(id),
  token_hash NVARCHAR(MAX),
  expires_at DATETIMEOFFSET,
  created_at DATETIMEOFFSET
);

-- Intentos de login (rate limiting)
CREATE TABLE dbo.app_login_attempts (
  id BIGINT IDENTITY PRIMARY KEY,
  user_id UNIQUEIDENTIFIER,
  email NVARCHAR(255),
  ip_address VARCHAR(50),
  succeeded BIT,
  failure_reason VARCHAR(255),
  attempted_at DATETIMEOFFSET,
  user_agent NVARCHAR(MAX)
);
```

### Paso 5: Crear usuario de prueba

```bash
# Editar scripts/create-test-user.js con tus credenciales
node scripts/create-test-user.js

# Debería crear: admin@test.com / test
```

### Paso 6: Testing

```bash
# Test automatizado
bash scripts/run-tests.sh

# O manual
npm run dev
# Acceder a http://localhost:3000/login
```

---

## 🏗️ ARQUITECTURA REPRODUCIBLE

### Stack Tecnológico

```
Frontend:        Next.js 16 + React 19 + TypeScript
Styling:         Tailwind CSS
State:           Zustand
Data Fetching:   TanStack Query (@tanstack/react-query)
Backend:         Next.js API Routes
Database:        SQL Server 2019 Enterprise
Auth:            Session-based (httpOnly cookies)
Deployment:      Docker + Docker Compose + Nginx
```

### Flujo de Datos

```
Usuario
  ↓
Next.js API Route (autenticación)
  ↓
SQL Server (queries parametrizadas)
  ↓
React Component (TanStack Query)
  ↓
Browser (Tailwind CSS)
```

### Seguridad Implementada

- ✅ HTTPS ready (SSL/TLS)
- ✅ httpOnly cookies (XSS protection)
- ✅ CSRF tokens (si se configura)
- ✅ Rate limiting en login (5 intentos/15min)
- ✅ Queries parametrizadas (SQL injection protection)
- ✅ No-root Docker user
- ✅ Health checks automáticos
- ✅ Session expiration (12 horas configurable)

---

## 📁 ESTRUCTURA DE CARPETAS

```
proyecto/
├── app/
│   ├── page.tsx                 # Dashboard principal
│   ├── login/
│   │   └── page.tsx            # Página de login
│   ├── leads/
│   │   └── page.tsx            # Vista de leads
│   ├── admin/
│   │   └── page.tsx            # Panel de admin
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts   # POST /api/auth/login
│       │   └── logout/route.ts  # POST /api/auth/logout
│       ├── kpis/route.ts        # GET /api/kpis
│       ├── leads/route.ts       # GET /api/leads
│       └── me/route.ts          # GET /api/me
├── lib/
│   ├── db/
│   │   └── mssql.ts           # Connection pool
│   ├── auth-db.ts             # Auth queries
│   ├── dashboard-db.ts        # Dashboard queries
│   ├── api-auth-sql.ts        # Auth middleware
│   └── session.ts             # Session helpers
├── components/
│   ├── dashboard-client.tsx   # Dashboard component
│   ├── leads-client.tsx       # Leads component
│   ├── logout-button.tsx      # Logout button
│   └── ui/                    # Componentes reutilizables
├── public/
│   ├── rp-logo.png
│   └── favicon.ico
├── scripts/
│   ├── create-test-user.js    # Setup inicial
│   └── run-tests.sh           # Suite de testing
├── Dockerfile
├── docker-compose.yml
├── nginx.conf
├── .dockerignore
├── next.config.ts
├── tsconfig.json
├── .env.example
├── package.json
└── README.md
```

---

## 🔑 VARIABLES DE ENTORNO CRÍTICAS

```bash
# SQL Server (REQUIRED)
SQLSERVER_HOST=
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=
SQLSERVER_USER=
SQLSERVER_PASSWORD=

# Authentication (REQUIRED)
AUTH_SESSION_HOURS=12
AUTH_RATE_WINDOW_MINUTES=15
AUTH_EMAIL_FAILURE_LIMIT=5
AUTH_IP_FAILURE_LIMIT=20
AUTH_COOKIE_SECURE=false

# Node (OPTIONAL)
NODE_ENV=development
DEBUG=false
```

---

## ✅ CHECKLIST DE CONFIGURACIÓN

Para que funcione en otro proyecto:

- [ ] package.json actualizado con dependencias
- [ ] .env.local configurado con credenciales correctas
- [ ] Tablas de autenticación creadas en SQL Server
- [ ] Usuario de prueba creado (admin@test.com)
- [ ] `npm install` ejecutado
- [ ] `npm run dev` inicia sin errores
- [ ] Login funciona con admin@test.com / test
- [ ] Dashboard carga datos
- [ ] Logout funciona
- [ ] `npm run build` pasa sin errores
- [ ] Docker build exitoso: `docker build -t app:latest .`
- [ ] Docker compose inicia: `docker-compose up -d`

---

## 🚀 DEPLOYMENT EN HOSTINGER

Una vez configurado localmente y funcionando:

1. Compra VPS en Hostinger
2. Conecta vía SSH
3. Ejecuta:

```bash
curl -fsSL https://get.docker.com | sh
cd /opt
git clone tu_repo
cd proyecto
cp .env.example .env.local
# Editar .env.local con credenciales
docker-compose up -d
```

4. Accede: `http://tu_ip_vps:3000/login`
5. Configura SSL: Ver DOCKER_DEPLOYMENT.md

---

## 📚 DOCUMENTACIÓN COMPLETA

Este proyecto incluye:

| Documento | Propósito |
|-----------|-----------|
| **README.md** | Presentación general del proyecto |
| **DOCKER_DEPLOYMENT.md** | Deployment en Hostinger paso-a-paso |
| **TESTING_GUIDE.md** | Testing manual y automatizado |
| **AUDIT_REPORT_2026-09-11.md** | Auditoría de código y limpieza |
| **CLAUDE.md** | Directrices para colaboración con IA |
| **EXPORT_PROJECT_GUIDE.md** | Este documento |

---

## 🔄 REPRODUCCIÓN EXACTA

Para reproducir este proyecto en OTRO repositorio:

```bash
# 1. Nuevo proyecto Next.js
npx create-next-app@latest mi-proyecto --typescript

# 2. Copiar archivos críticos
cd mi-proyecto
cp ../ppl-dashboard/Dockerfile .
cp ../ppl-dashboard/docker-compose.yml .
cp ../ppl-dashboard/nginx.conf .
cp ../ppl-dashboard/.dockerignore .
cp ../ppl-dashboard/next.config.ts .
cp ../ppl-dashboard/tsconfig.json .
cp -r ../ppl-dashboard/lib .
cp -r ../ppl-dashboard/scripts .

# 3. Copiar componentes (opcional)
cp -r ../ppl-dashboard/components .

# 4. Copiar package.json dependencias
# Instalar: npm install mssql @tanstack/react-query zustand next-intl

# 5. Configurar .env.local
cat > .env.local << 'EOF'
SQLSERVER_HOST=tu_ip
SQLSERVER_PORT=1433
SQLSERVER_DATABASE=tu_db
SQLSERVER_USER=tu_usuario
SQLSERVER_PASSWORD=tu_contraseña
EOF

# 6. Verificar
npm run dev
bash scripts/run-tests.sh
```

---

## 📞 TROUBLESHOOTING

### "Module not found: mssql"
```bash
npm install mssql
```

### "Connection refused"
Verificar credenciales en .env.local

### "Port 3000 already in use"
```bash
lsof -i :3000
kill -9 <PID>
```

### Docker build falla
```bash
docker system prune -a
docker build -t app:latest .
```

---

## 📊 ESTADÍSTICAS DEL PROYECTO

| Métrica | Valor |
|---------|-------|
| Líneas de código | ~2,500 |
| Componentes React | 8+ |
| API Endpoints | 6+ |
| Tablas SQL | 4+ |
| Docker image size | ~180MB |
| Container RAM | ~200MB |
| Startup time | ~15s |
| Build time | ~45s |

---

## 🎯 PRÓXIMOS PASOS

1. ✅ Testear localmente (HECHO)
2. ⏳ Comprar VPS en Hostinger
3. ⏳ Desplegar con Docker
4. ⏳ Configurar SSL/HTTPS
5. ⏳ Setup de monitoreo

---

## 📄 ARCHIVOS EN GIT

Todos estos archivos están en GitHub en la rama `dev`:

```
https://github.com/RP-Solutions-Development/LytixDashboard/tree/dev
```

Commits relacionados:
- `5e6c746` - Docker configuration
- `4908348` - Testing guide
- `098aa14` - Automated test script
- `ab87d20` - Audit report
- `be10922` - Cleanup and fixes

---

**Proyecto completamente transferible a otro contexto.**  
**Listo para producción.** ✅

