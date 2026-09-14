# 🧪 TESTING GUIDE - PPL Dashboard hasta VMP

Guía completa para testear la base de datos, autenticación y dashboard.

---

## 📋 Fase 1: Testing de Conexión a SQL Server

### 1.1 Verificar conexión básica

```bash
# Desde el proyecto raíz
node << 'EOF'
const mssql = require('mssql');

const config = {
  server: '2.25.101.200',
  port: 1433,
  user: 'leads_dashboard_app',
  password: 'Ld9!abe865f3029f47ffb547b5fdfb950905xQ',
  database: 'leads',
  encrypt: false,
  trustServerCertificate: true,
  connectionTimeout: 15000,
  requestTimeout: 30000,
};

async function testConnection() {
  const pool = new mssql.ConnectionPool(config);
  
  try {
    console.log('🔗 Intentando conectar a SQL Server...');
    await pool.connect();
    console.log('✅ Conexión exitosa!');
    
    // Test query
    const result = await pool.request().query('SELECT GETUTCDATE() as current_time');
    console.log('📅 Hora en BD:', result.recordset[0].current_time);
    
    await pool.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testConnection();
EOF
```

**Resultado esperado:**
```
✅ Conexión exitosa!
📅 Hora en BD: 2026-09-14 15:30:45.123
```

---

### 1.2 Verificar tablas de autenticación

```bash
node << 'EOF'
const mssql = require('mssql');

const config = {
  server: '2.25.101.200',
  port: 1433,
  user: 'leads_dashboard_app',
  password: 'Ld9!abe865f3029f47ffb547b5fdfb950905xQ',
  database: 'leads',
  encrypt: false,
  trustServerCertificate: true,
};

async function checkTables() {
  const pool = new mssql.ConnectionPool(config);
  
  try {
    await pool.connect();
    
    console.log('📋 Verificando tablas de autenticación...\n');
    
    // Usuarios
    const users = await pool.request().query(`
      SELECT COUNT(*) as count FROM dbo.app_users
    `);
    console.log('👤 Usuarios:', users.recordset[0].count);
    
    // Sesiones
    const sessions = await pool.request().query(`
      SELECT COUNT(*) as count FROM dbo.app_sessions WHERE expires_at > GETUTCDATE()
    `);
    console.log('🔑 Sesiones activas:', sessions.recordset[0].count);
    
    // Intentos de login
    const attempts = await pool.request().query(`
      SELECT COUNT(*) as count FROM dbo.app_login_attempts 
      WHERE attempted_at > DATEADD(HOUR, -1, GETUTCDATE())
    `);
    console.log('🚫 Intentos de login (últimas 24h):', attempts.recordset[0].count);
    
    // Leads
    const leads = await pool.request().query(`
      SELECT COUNT(*) as count FROM dbo.leads
    `);
    console.log('📊 Leads en BD:', leads.recordset[0].count);
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTables();
EOF
```

---

### 1.3 Listar usuarios existentes

```bash
node << 'EOF'
const mssql = require('mssql');

const config = {
  server: '2.25.101.200',
  port: 1433,
  user: 'leads_dashboard_app',
  password: 'Ld9!abe865f3029f47ffb547b5fdfb950905xQ',
  database: 'leads',
  encrypt: false,
  trustServerCertificate: true,
};

async function listUsers() {
  const pool = new mssql.ConnectionPool(config);
  
  try {
    await pool.connect();
    
    const result = await pool.request().query(`
      SELECT id, email, display_name, role, is_active, created_at
      FROM dbo.app_users
      ORDER BY created_at DESC
    `);
    
    console.log('📋 Usuarios en la BD:\n');
    console.table(result.recordset);
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

listUsers();
EOF
```

**Resultado esperado:**
```
📋 Usuarios en la BD:

┌─────────┬──────────────────────────────────────┬─────────────────────────────────┬──────────┬───────────┐
│ (index) │ id                                   │ email                           │ role     │ is_active │
├─────────┼──────────────────────────────────────┼─────────────────────────────────┼──────────┼───────────┤
│ 0       │ '02A23192-BD46-4CD4-9C29-FBBDA5B02AC8' │ 'admin@test.com'               │ 'admin'  │ true      │
└─────────┴──────────────────────────────────────┴─────────────────────────────────┴──────────┴───────────┘
```

---

## 🧪 Fase 2: Testing de Autenticación

### 2.1 Iniciar servidor de desarrollo

```bash
npm run dev
```

Espera hasta ver:
```
✓ Ready in XXXms
```

Accede a: `http://localhost:3000/login`

---

### 2.2 Test de Login correcto

1. Abre `http://localhost:3000/login`
2. Ingresa:
   - **Email:** admin@test.com
   - **Password:** test
3. Presiona "Login"

**Resultado esperado:**
- ✅ Se redirige a dashboard (`http://localhost:3000`)
- ✅ Se ve el título "PPL Dashboard"
- ✅ Se muestra nombre del usuario (Test Admin)

---

### 2.3 Test de Login incorrecto

1. Vuelve a `/login`
2. Ingresa:
   - **Email:** admin@test.com
   - **Password:** wrong123
3. Presiona "Login"

**Resultado esperado:**
- ❌ Error: "Invalid email or password"
- 📍 Permanece en `/login`

---

### 2.4 Test de Rate Limiting

1. Intenta login 6 veces consecutivas con password incorrecto
   - Email: admin@test.com
   - Password: wrong (6 veces)

**Resultado esperado en intento 6:**
- ❌ Error: "Too many login attempts. Please try again later."
- ⏱️ Bloqueo por 15 minutos

---

### 2.5 Test de Sesión

Después de login exitoso:

```bash
# En otra terminal, verifica cookies
curl -b cookies.txt http://localhost:3000/

# Ver cookies guardadas
cat cookies.txt
```

**Resultado esperado:**
```
sessionId=<uuid>
sessionToken=<token>
```

---

### 2.6 Test de Logout

1. En dashboard, haz clic en "Logout"
2. Se redirige a `/login`
3. Intenta acceder a `http://localhost:3000`

**Resultado esperado:**
- ✅ Se redirige a `/login` (sesión inválida)
- 🍪 Cookies borradas

---

## 📊 Fase 3: Testing del Dashboard

### 3.1 Test de carga de KPIs

1. Login con admin@test.com / test
2. Dashboard debe mostrar:
   - ✅ Total de Leads
   - ✅ Leads este mes
   - ✅ Tasa de conversión
   - ✅ Ingresos

Verifica console del navegador:
```javascript
// En browser console
fetch('/api/kpis').then(r => r.json()).then(console.log)
```

**Resultado esperado:**
```json
{
  "data": {
    "total_leads": 3172,
    "this_month_leads": 145,
    "conversion_rate": 8.5,
    "revenue": 25000
  }
}
```

---

### 3.2 Test de Filtros

1. En dashboard, abre sección de filtros
2. Selecciona diferentes opciones:
   - Rangos de fechas
   - Suppliers
   - Buyers
   - Productos

**Resultado esperado:**
- ✅ KPIs se actualizan
- ✅ No hay errores en console
- ✅ Carga en < 2 segundos

---

### 3.3 Test de Leads

1. Navega a `/leads`
2. Debería mostrar tabla con:
   - ID del lead
   - Email
   - Status
   - Fecha

Prueba filtros y ordenamiento.

**Resultado esperado:**
- ✅ Se cargan leads
- ✅ Paginación funciona
- ✅ Filtros aplicados correctamente

---

### 3.4 Test de Admin (si tienes permiso)

1. Login con usuario admin
2. Navega a `/admin`
3. Debería mostrar:
   - ✅ Lista de usuarios
   - ✅ Botón para crear usuario
   - ✅ Opciones de editar/eliminar

---

## 🔌 Fase 4: Testing de APIs

### 4.1 Test de /api/me (usuario actual)

```bash
curl -b cookies.txt http://localhost:3000/api/me
```

**Resultado esperado:**
```json
{
  "userId": "02a23192-bd46-4cd4-9c29-fbbda5b02ac8",
  "email": "admin@test.com",
  "displayName": "Test Admin",
  "role": "admin"
}
```

---

### 4.2 Test de /api/kpis

```bash
curl -b cookies.txt http://localhost:3000/api/kpis
```

**Resultado esperado:**
```json
{
  "data": [
    {
      "total_leads": 3172,
      "leads_this_month": 145,
      "conversion_rate": 8.5,
      "revenue": 25000
    }
  ]
}
```

---

### 4.3 Test de /api/leads (con filtros)

```bash
# Sin filtros
curl -b cookies.txt http://localhost:3000/api/leads

# Con filtros
curl -b cookies.txt "http://localhost:3000/api/leads?dateFrom=2026-01-01&dateTo=2026-12-31"
```

---

### 4.4 Test de /api/filter-options

```bash
curl -b cookies.txt http://localhost:3000/api/filter-options
```

**Resultado esperado:**
```json
{
  "suppliers": [
    { "id": 1, "name": "Supplier A" },
    ...
  ],
  "buyers": [
    { "id": 2, "name": "Buyer A" },
    ...
  ],
  "products": [
    { "code": "windows", "name": "Windows" },
    ...
  ]
}
```

---

### 4.5 Test sin autenticación

```bash
curl http://localhost:3000/api/kpis
```

**Resultado esperado:**
```json
{ "error": "Unauthorized" }
```

Status: 401

---

## ✅ Fase 5: Checklist de VMP

Marca cada item como completado:

### Autenticación
- [ ] Login funciona con credenciales correctas
- [ ] Login rechaza credenciales incorrectas
- [ ] Rate limiting activo (bloquea después de 5 intentos)
- [ ] Logout limpia sesión y cookies
- [ ] Acceso protegido (sin sesión → redirige a /login)
- [ ] Sesión no expira (12 horas)

### Dashboard
- [ ] Carga sin errores
- [ ] Muestra KPIs principales
- [ ] Filtros funcionan
- [ ] Datos actualizan al cambiar filtros
- [ ] Responsive (funciona en mobile)
- [ ] Performance aceptable (<2s carga)

### Datos
- [ ] Base de datos conectada
- [ ] Datos mostrados son correctos
- [ ] Leads mostrados pertenecen al usuario
- [ ] Filtros por fecha funcionan
- [ ] Filtros por supplier/buyer funcionan

### APIs
- [ ] /api/auth/login funciona
- [ ] /api/auth/logout funciona
- [ ] /api/me devuelve usuario correcto
- [ ] /api/kpis devuelve datos
- [ ] /api/leads devuelve datos
- [ ] /api/filter-options devuelve opciones
- [ ] Todas retornan 401 sin sesión

### Seguridad
- [ ] No hay credenciales en .env.example
- [ ] .env.local no está en Git
- [ ] Cookies son httpOnly
- [ ] CSRF protection (si aplica)
- [ ] SQL injection protection
- [ ] Rate limiting en login

### Deployment
- [ ] Build pasa: `npm run build`
- [ ] Lint pasa: `npm run lint`
- [ ] Docker funciona: `docker-compose up -d`
- [ ] Archivo de deployment documentado
- [ ] GitHub tiene código actualizado

---

## 🐛 Troubleshooting

### "Connection refused" a SQL Server
```bash
# Verificar conectividad de red
ping 2.25.101.200

# Intentar telnet
telnet 2.25.101.200 1433
```

### "Invalid login" a SQL Server
```bash
# Verificar credenciales
echo "user: leads_dashboard_app"
echo "pass: Ld9!abe865f3029f47ffb547b5fdfb950905xQ"
```

### "Too many login attempts" después de resetear
```bash
# Limpiar intentos
node scripts/create-test-user.js
```

### Dashboard muestra datos vacíos
1. Verifica que el usuario tiene acceso a organizaciones
2. Revisa SQL Server logs
3. Prueba con usuario admin

### Errores en console del navegador
```javascript
// En browser console
localStorage.clear()
sessionStorage.clear()
location.reload()
```

---

## 📈 Métricas de VMP

Para considerar "VMP Ready":

| Métrica | Mínimo | Objetivo |
|---------|--------|----------|
| Uptime | 99% | 99.9% |
| Login time | < 2s | < 1s |
| Dashboard load | < 3s | < 1.5s |
| API response | < 500ms | < 200ms |
| Error rate | < 1% | < 0.1% |

---

## 🚀 Próximos pasos después de VMP

1. [ ] Deploy a Hostinger
2. [ ] Configurar SSL/HTTPS
3. [ ] Configurar dominio (dashboard.rpsolutions.io)
4. [ ] Backups automáticos
5. [ ] Monitoreo y alertas
6. [ ] Documentación de usuario
7. [ ] Capacitación del equipo

---

**Status:** 🟢 Ready for VMP Testing
