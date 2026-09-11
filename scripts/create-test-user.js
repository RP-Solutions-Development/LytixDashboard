#!/usr/bin/env node

const mssql = require('mssql')

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
}

async function createTestUser() {
  const pool = new mssql.ConnectionPool(config)

  try {
    console.log('🔗 Conectando a SQL Server...')
    await pool.connect()
    console.log('✅ Conectado a leads')

    // Limpiar intentos previos
    console.log('\n🧹 Limpiando intentos de login previos...')
    await pool
      .request()
      .input('email', mssql.NVarChar, 'admin@test.com')
      .query('DELETE FROM dbo.app_login_attempts WHERE email = @email')
    console.log('✅ Intentos limpiados')

    // Crear usuario
    console.log('\n👤 Creando usuario de prueba...')
    const userId = mssql.VarChar
    const result = await pool.request().query(`
      IF NOT EXISTS (SELECT 1 FROM dbo.app_users WHERE email = 'admin@test.com')
      BEGIN
        INSERT INTO dbo.app_users
        (id, email, display_name, password_hash, role, is_active, created_at, updated_at)
        VALUES
        (NEWID(), 'admin@test.com', 'Test Admin', 'test', 'admin', 1, GETUTCDATE(), GETUTCDATE())
        SELECT 'CREADO' AS status
      END
      ELSE
      BEGIN
        SELECT 'YA_EXISTE' AS status
      END
    `)

    const status = result.recordset[0].status

    if (status === 'CREADO') {
      console.log('✅ Usuario creado exitosamente')
    } else {
      console.log('ℹ️  Usuario ya existe')
    }

    // Mostrar usuarios
    console.log('\n📋 Usuarios existentes:')
    const users = await pool.request().query(`
      SELECT id, email, display_name, role, is_active
      FROM dbo.app_users
      ORDER BY created_at DESC
    `)

    console.table(users.recordset)

    console.log('\n✅ Listo para testear!')
    console.log('\n📝 Credenciales:')
    console.log('   Email: admin@test.com')
    console.log('   Password: test')
    console.log('\n🌐 Abre: http://localhost:3000/login')

    await pool.close()
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createTestUser()
