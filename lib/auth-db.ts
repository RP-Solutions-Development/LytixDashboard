import { getConnection, mssql } from './db/mssql'
import crypto from 'crypto'

export interface SessionProfile {
  userId: string
  email: string
  displayName: string
  role: 'admin' | 'client'
  isActive: boolean
}

export interface User {
  id: string
  email: string
  displayName: string
  role: 'admin' | 'client'
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export async function getUserById(userId: string): Promise<User | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('id', mssql.UniqueIdentifier, userId)
      .query(`
        SELECT
          id,
          email,
          display_name AS displayName,
          role,
          is_active AS isActive,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM dbo.app_users
        WHERE id = @id
      `)

    if (result.recordset.length === 0) return null

    const row = result.recordset[0]
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  } catch (error) {
    console.error('Error getting user:', error)
    return null
  }
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('email', mssql.NVarChar, email.toLowerCase())
      .query(`
        SELECT
          id,
          email,
          display_name AS displayName,
          role,
          is_active AS isActive,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM dbo.app_users
        WHERE email = @email
      `)

    if (result.recordset.length === 0) return null

    const row = result.recordset[0]
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  } catch (error) {
    console.error('Error getting user by email:', error)
    return null
  }
}

export async function getUserWithPasswordHash(email: string): Promise<(User & { passwordHash: string }) | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('email', mssql.NVarChar, email.toLowerCase())
      .query(`
        SELECT
          id,
          email,
          display_name AS displayName,
          role,
          is_active AS isActive,
          password_hash AS passwordHash,
          created_at AS createdAt,
          updated_at AS updatedAt
        FROM dbo.app_users
        WHERE email = @email
      `)

    if (result.recordset.length === 0) return null

    const row = result.recordset[0]
    return {
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      isActive: row.isActive,
      passwordHash: row.passwordHash,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    }
  } catch (error) {
    console.error('Error getting user with password:', error)
    return null
  }
}

export async function createSession(userId: string, token: string, expiresInHours = 12): Promise<{ id: string } | null> {
  try {
    const pool = await getConnection()
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
    const sessionId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    const result = await pool
      .request()
      .input('id', mssql.UniqueIdentifier, sessionId)
      .input('user_id', mssql.UniqueIdentifier, userId)
      .input('token_hash', mssql.NVarChar, tokenHash)
      .input('expires_at', mssql.DateTimeOffset, expiresAt)
      .query(`
        INSERT INTO dbo.app_sessions (id, user_id, token_hash, expires_at, created_at)
        VALUES (@id, @user_id, @token_hash, @expires_at, GETUTCDATE())
        SELECT id FROM dbo.app_sessions WHERE id = @id
      `)

    if (result.recordset.length === 0) return null
    return { id: result.recordset[0].id }
  } catch (error) {
    console.error('Error creating session:', error)
    return null
  }
}

export async function validateSession(sessionId: string, tokenHash: string): Promise<SessionProfile | null> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('id', mssql.UniqueIdentifier, sessionId)
      .input('token_hash', mssql.NVarChar, tokenHash)
      .query(`
        SELECT
          s.user_id AS userId,
          u.email,
          u.display_name AS displayName,
          u.role,
          u.is_active AS isActive
        FROM dbo.app_sessions s
        JOIN dbo.app_users u ON s.user_id = u.id
        WHERE s.id = @id
          AND s.token_hash = @token_hash
          AND s.expires_at > GETUTCDATE()
          AND u.is_active = 1
      `)

    if (result.recordset.length === 0) return null

    const row = result.recordset[0]
    return {
      userId: row.userId,
      email: row.email,
      displayName: row.displayName,
      role: row.role,
      isActive: row.isActive,
    }
  } catch (error) {
    console.error('Error validating session:', error)
    return null
  }
}

export async function revokeSession(sessionId: string): Promise<boolean> {
  try {
    const pool = await getConnection()
    await pool
      .request()
      .input('id', mssql.UniqueIdentifier, sessionId)
      .query(`
        DELETE FROM dbo.app_sessions
        WHERE id = @id
      `)
    return true
  } catch (error) {
    console.error('Error revoking session:', error)
    return false
  }
}

export async function logLoginAttempt(email: string, ipAddress: string, success: boolean): Promise<void> {
  try {
    const pool = await getConnection()
    await pool
      .request()
      .input('email', mssql.NVarChar, email.toLowerCase())
      .input('ip_address', mssql.VarChar, ipAddress)
      .input('success', mssql.Bit, success ? 1 : 0)
      .query(`
        INSERT INTO dbo.app_login_attempts (email, ip_address, success, attempted_at)
        VALUES (@email, @ip_address, @success, GETUTCDATE())
      `)
  } catch (error) {
    console.error('Error logging login attempt:', error)
  }
}

export async function checkLoginRateLimit(email: string, maxAttempts = 5, windowMinutes = 15): Promise<boolean> {
  try {
    const pool = await getConnection()
    const result = await pool
      .request()
      .input('email', mssql.NVarChar, email.toLowerCase())
      .input('max_attempts', mssql.Int, maxAttempts)
      .input('window_minutes', mssql.Int, windowMinutes)
      .query(`
        SELECT COUNT(*) AS attempt_count
        FROM dbo.app_login_attempts
        WHERE email = @email
          AND succeeded = 0
          AND attempted_at > DATEADD(MINUTE, -@window_minutes, GETUTCDATE())
      `)

    const attemptCount = result.recordset[0].attempt_count
    return attemptCount < maxAttempts
  } catch (error) {
    console.error('Error checking login rate limit:', error)
    return false
  }
}
