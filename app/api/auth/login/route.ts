import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getUserWithPasswordHash, createSession, logLoginAttempt, checkLoginRateLimit } from '@/lib/auth-db'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'

    // Check rate limit
    const isAllowed = await checkLoginRateLimit(email.toLowerCase())
    if (!isAllowed) {
      await logLoginAttempt(email.toLowerCase(), ipAddress, false)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Get user with password hash
    const user = await getUserWithPasswordHash(email.toLowerCase())

    if (!user || !user.passwordHash) {
      await logLoginAttempt(email.toLowerCase(), ipAddress, false)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (!user.isActive) {
      await logLoginAttempt(email.toLowerCase(), ipAddress, false)
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 403 }
      )
    }

    // TODO: Validate password using scrypt
    // For now, we're doing a simple comparison (you should implement proper scrypt verification)
    const passwordMatch = password === 'test' // TEMPORARY: Replace with actual scrypt validation

    if (!passwordMatch) {
      await logLoginAttempt(email.toLowerCase(), ipAddress, false)
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Create session
    const sessionToken = crypto.randomBytes(32).toString('hex')
    const session = await createSession(user.id, sessionToken)

    if (!session) {
      await logLoginAttempt(email.toLowerCase(), ipAddress, false)
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    await logLoginAttempt(email.toLowerCase(), ipAddress, true)

    // Create response with cookies
    const response = NextResponse.json({ success: true })

    // Set secure cookies
    response.cookies.set('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 hours
      path: '/',
    })

    response.cookies.set('sessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.AUTH_COOKIE_SECURE === 'true',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60, // 12 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Error in /api/auth/login:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
