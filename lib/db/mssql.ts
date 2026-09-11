import mssql from 'mssql'

const config: any = {
  server: process.env.SQLSERVER_HOST || 'localhost',
  port: parseInt(process.env.SQLSERVER_PORT || '1433'),
  user: process.env.SQLSERVER_USER,
  password: process.env.SQLSERVER_PASSWORD,
  database: process.env.SQLSERVER_DATABASE,
  encrypt: process.env.SQLSERVER_ENCRYPT === 'true',
  trustServerCertificate: process.env.SQLSERVER_TRUST_SERVER_CERTIFICATE === 'true',
  enableKeepAlive: true,
  connectionTimeout: 15000,
  requestTimeout: 30000,
  pool: {
    max: parseInt(process.env.SQLSERVER_POOL_MAX || '20'),
    min: 2,
    idleTimeoutMillis: 30000,
  },
}

let pool: mssql.ConnectionPool | null = null

export async function getConnection(): Promise<mssql.ConnectionPool> {
  if (!pool) {
    pool = new mssql.ConnectionPool(config)
    await pool.connect()
    pool.on('error', () => {
      pool = null
    })
  }
  return pool
}

export async function closeConnection(): Promise<void> {
  if (pool) {
    await pool.close()
    pool = null
  }
}

export { mssql }
