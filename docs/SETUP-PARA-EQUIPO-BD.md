# Guía de Setup para el Equipo de Base de Datos

## Contexto del Proyecto

**ppl-dashboard** es un dashboard analítico de performance de leads construido en Next.js.
El frontend se conecta a una base de datos **PostgreSQL** a través de una capa de funciones RPC y tablas.

Actualmente la base de datos vive en Supabase (cloud). El objetivo es migrarla a un **servidor dedicado propio**.

---

## Decisión Importante: Cómo Conectar el Dashboard a la Nueva BD

El código actual usa `@supabase/ssr` para conectarse. Al mover la BD al servidor dedicado, hay **dos caminos**:

### Opción A — Supabase Self-Hosted (recomendada si quieren mínimo cambio de código)

Supabase es open source y puede instalarse en cualquier servidor.
Provee la misma API que la nube, por lo que el código del dashboard **no necesita cambios**, solo las credenciales en `.env.local`.

- Documentación: https://supabase.com/docs/guides/self-hosting/docker
- Requiere: Docker en el servidor dedicado
- El equipo de DB trabaja directamente en PostgreSQL (Supabase es solo una capa encima)

**Variables de entorno a actualizar en `.env.local`:**
```
NEXT_PUBLIC_SUPABASE_URL=https://TU_SERVIDOR_DEDICADO/supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=<nueva anon key generada al instalar>
SUPABASE_SERVICE_ROLE_KEY=<nueva service role key generada al instalar>
```

---

### Opción B — PostgreSQL Puro (sin Supabase)

Si prefieren PostgreSQL directo (sin instalar Supabase), el código del dashboard necesita modificaciones en:
- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/api-auth.ts` (autenticación de usuarios)

Implica reemplazar `@supabase/ssr` por un cliente PostgreSQL como `pg` o `postgres.js`, y también reemplazar el sistema de autenticación de Supabase Auth por otro mecanismo (ej: NextAuth.js).

> **Este camino requiere trabajo de desarrollo adicional en el dashboard.**

---

## Esquema de la Base de Datos

### Diagrama ER

```
LP_CAMPAIGNS ──< LP_SYNC_LOG
LP_LEADS_RAW ──< LEAD_EVENTS >── LEAD_IDENTITY
PARTNERS ──< DASHBOARD_USERS
PARTNERS ──< USER_PARTNERS
PARTNERS ──< PARTNER_LP
```

Para una versión visual: importar el archivo `docs/database-schema.dbml` en https://dbdiagram.io

---

### Tablas Base (crear en este orden)

#### `partners`
Catálogo de partners internos (suppliers y buyers).

```sql
CREATE TABLE partners (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  partner_type text NOT NULL,  -- 'supplier' o 'buyer'
  status       text NOT NULL,
  report_email text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);
```

#### `dashboard_users`
Perfiles de usuarios del dashboard.

```sql
CREATE TABLE dashboard_users (
  id           uuid PRIMARY KEY,  -- debe coincidir con auth.users.id (Supabase)
  display_name text NOT NULL,
  role         text NOT NULL,     -- 'admin' o 'supplier'
  partner_id   uuid REFERENCES partners(id),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
```

#### `user_partners`
Relación muchos-a-muchos entre usuarios y partners.

```sql
CREATE TABLE user_partners (
  user_id    uuid NOT NULL,
  partner_id uuid NOT NULL REFERENCES partners(id),
  role       text,
  created_at timestamptz,
  PRIMARY KEY (user_id, partner_id)
);
```

#### `partner_lp`
Mapping entre partners internos e IDs externos de LeadProsper.

```sql
CREATE TABLE partner_lp (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES partners(id),
  lp_id      text NOT NULL,
  lp_type    text,
  created_at timestamptz
);
```

#### `lp_campaigns`
Catálogo de campañas de LeadProsper.

```sql
CREATE TABLE lp_campaigns (
  lp_campaign_id bigint PRIMARY KEY,
  campaign_name  text NOT NULL,
  vertical       text,
  status         text NOT NULL,
  last_synced_at timestamptz,
  sync_from_date date,
  created_at     timestamptz,
  updated_at     timestamptz
);
```

#### `lp_sync_log`
Log de ejecuciones de ingesta desde LP API.

```sql
CREATE TABLE lp_sync_log (
  id             bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  run_id         text,
  lp_campaign_id bigint REFERENCES lp_campaigns(lp_campaign_id),
  started_at     timestamptz,
  finished_at    timestamptz,
  status         text NOT NULL,
  leads_fetched  integer NOT NULL DEFAULT 0,
  leads_inserted integer NOT NULL DEFAULT 0,
  leads_skipped  integer NOT NULL DEFAULT 0,
  date_from      date,
  date_to        date,
  error_message  text,
  created_at     timestamptz DEFAULT now()
);
```

#### `lp_leads_raw`
Leads crudos importados desde LeadProsper.

```sql
CREATE TABLE lp_leads_raw (
  leadprosper_lead_id    text PRIMARY KEY,
  id                     bigint NOT NULL,
  first_name             varchar,
  last_name              varchar,
  email                  varchar,
  phone                  varchar,
  address                text,
  city                   varchar,
  state                  varchar,
  zip_code               varchar,
  campaign_id            bigint,  -- relación lógica con lp_campaigns
  campaign_name          text,
  supplier_campaign_name text,
  buyer_name             varchar,
  buyer_campaign_name    varchar,
  buyer_status           varchar,
  lp_cost                numeric,
  buyer_sell_price       numeric,
  profit                 numeric,
  lead_created_at        timestamptz,
  fetched_at             timestamptz,
  source                 text,
  raw_payload            jsonb,
  status_final           varchar,
  buyer_callback_date    timestamptz,
  test                   boolean
);
```

#### `lead_identity`
Identidad normalizada para deduplicación.

```sql
CREATE TABLE lead_identity (
  lead_key   bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  lead_id    text,
  norm_phone text,
  norm_email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### `lead_events`
Eventos de leads normalizados.

```sql
CREATE TABLE lead_events (
  id                  bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vertical            text,
  event_type          text NOT NULL,
  source_system       text NOT NULL,
  buyer               text,
  supplier            text,
  lead_id             text,
  norm_phone          text,
  norm_email          text,
  lead_key            bigint REFERENCES lead_identity(lead_key),
  event_ts            timestamptz,
  imported_at         timestamptz NOT NULL DEFAULT now(),
  event_day           date,
  event_month         date,
  status_bucket       text,
  status_raw          text,
  error_message       text,
  price               numeric,
  payload             jsonb,
  leadprosper_lead_id text REFERENCES lp_leads_raw(leadprosper_lead_id)
);
```

#### `lead_facts`
Tabla principal consumida por el dashboard (read model).

```sql
CREATE TABLE lead_facts (
  lead_id       text PRIMARY KEY,
  event_day     date,
  supplier      text,
  buyer         varchar,
  supplier_id   uuid,  -- relación lógica con partners.id
  buyer_id      uuid,  -- relación lógica con partners.id
  status_bucket text,
  status_raw    varchar,
  disposition   text,
  price         numeric,
  source        text
);
```

#### `disposition_map`

```sql
CREATE TABLE disposition_map (
  id              integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  buyer_name      text NOT NULL,
  raw_value       text NOT NULL,
  disposition     text NOT NULL,
  sold            boolean NOT NULL DEFAULT false,
  appointment_set boolean NOT NULL DEFAULT false,
  returned        boolean NOT NULL DEFAULT false
);
```

#### `buyer_reports`

```sql
CREATE TABLE buyer_reports (
  id                 bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  upload_id          bigint,
  lead_id            text,
  buyer_name         text,
  appointment_issued smallint,
  appointment_set    smallint,
  appointment_ids    text,
  gross_amount       numeric,
  net_amount         numeric,
  created_at         timestamptz,
  imported_at        timestamptz,
  raw_payload        jsonb,
  email              text,
  product            text,
  phone              text,
  date               timestamptz,
  reason             text
);
```

#### `vertical_classification_rules`

```sql
CREATE TABLE vertical_classification_rules (
  id       integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  vertical varchar NOT NULL,
  pattern  text NOT NULL
);
```

---

## Vistas Requeridas por el Dashboard

El dashboard usa estas vistas (no las tablas directamente). **Deben recrearse** en la nueva base:

| Vista | Descripción |
|-------|-------------|
| `v_leads_summary` | Totales generales: leads, revenue, cost, profit, ROI |
| `v_leads_by_buyer` | Ranking agregado por buyer |
| `v_leads_by_state` | Leads por estado/ciudad |
| `v_leads_hourly` | Performance por hora |
| `v_metrics_monthly_buyer` | Métricas mensuales por buyer |
| `vw_metrics_by_vertical` | Métricas por mes, buyer, supplier y vertical |
| `vw_internal_lead_report` | Reporte interno por lead |

> [!WARNING]
> El SQL de estas vistas **no está versionado en el repo**. Viven dentro de la base actual en Supabase.
> Exportarlas con `pg_dump --schema-only` (ver sección abajo).

---

## Funciones RPC Requeridas

Todas las pantallas del dashboard llaman a estas funciones PostgreSQL:

| Función | Pantalla que la usa |
|---------|---------------------|
| `fn_my_profile()` | Autenticación / header |
| `fn_get_min_event_day()` | Filtro de fechas |
| `fn_get_distinct_verticals()` | Filtro de verticales |
| `fn_dashboard_kpis(...)` | KPIs principales |
| `fn_dashboard_financials(...)` | Scorecards financieros |
| `fn_dashboard_trends(...)` | Gráfico de tendencias |
| `fn_dashboard_suppliers(...)` | Ranking de suppliers |
| `fn_dashboard_buyers(...)` | Ranking de buyers |
| `fn_dashboard_geo(...)` | Mapa geográfico |
| `fn_dashboard_leads(...)` | Tabla de leads |
| `fn_process_lp_leads_raw()` | Procesa raw → facts |

> [!WARNING]
> Igual que las vistas, el SQL de estas funciones debe exportarse desde la base actual.

---

## Cómo Exportar la Base Actual (Supabase Cloud)

Para obtener vistas + funciones + estructura completa:

```bash
# Exportar esquema completo (estructura, vistas, funciones — sin datos)
pg_dump \
  --schema-only \
  --no-owner \
  --no-privileges \
  -n public \
  "postgresql://postgres:[PASSWORD]@db.yqsdeufqbmkcznroieki.supabase.co:5432/postgres" \
  > schema_completo.sql

# Exportar datos de tablas de referencia (partners, campañas, reglas, etc.)
pg_dump \
  --data-only \
  --table=partners \
  --table=disposition_map \
  --table=lp_campaigns \
  --table=vertical_classification_rules \
  "postgresql://postgres:[PASSWORD]@db.yqsdeufqbmkcznroieki.supabase.co:5432/postgres" \
  > datos_referencia.sql
```

La contraseña y credenciales de acceso las tiene quien administra el proyecto Supabase actual.

---

## Arquitectura de Capas

```
┌──────────────────────────────────────────┐
│  STAGING / RAW                           │
│  lp_leads_raw, buyer_reports             │
│  (datos importados sin procesar)         │
├──────────────────────────────────────────┤
│  CORE NORMALIZADO                        │
│  partners, lp_campaigns, lead_identity   │
│  lead_events, dashboard_users            │
├──────────────────────────────────────────┤
│  READ MODEL / DASHBOARD                  │
│  lead_facts, vistas v_* / vw_*           │
│  funciones fn_dashboard_*                │
└──────────────────────────────────────────┘
```

---

## Recomendaciones para la Nueva Base

1. **Declarar FKs faltantes** (actualmente son relaciones lógicas sin constraint):
   - `lead_facts.supplier_id → partners.id`
   - `lead_facts.buyer_id → partners.id`
   - `lp_leads_raw.campaign_id → lp_campaigns.lp_campaign_id`

2. **Agregar CHECK constraints** para valores cerrados:
   - `partners.partner_type IN ('supplier', 'buyer')`
   - `dashboard_users.role IN ('admin', 'supplier')`
   - `partners.status IN ('active', 'inactive')`

3. **Unificar el modelo de permisos**: el sistema tiene `dashboard_users.partner_id` Y `user_partners`. Decidir cuál usar como fuente de verdad.

4. **Versionar las funciones y vistas** en el repo (carpeta `db/functions/`) para poder recrearlas fácilmente en cualquier entorno.

---

## Archivos de Referencia en Este Repositorio

| Archivo | Contenido |
|---------|-----------|
| `docs/database-schema.md` | Descripción detallada de tablas, columnas y relaciones |
| `docs/database-schema.dbml` | Esquema para importar en dbdiagram.io |
| `docs/database-er.mmd` | Diagrama ER en Mermaid |
| `docs/database-normalization-dashboard-usage.md` | Análisis de normalización y uso por pantalla |
| `.env.example` | Variables de entorno requeridas por el dashboard |
