import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireAuth } from '@/lib/api-auth-sql'

async function requireAdmin() {
  const auth = await requireAuth()
  if (!auth.ok) return { ok: false as const, response: auth.response }
  if (auth.profile.role !== 'admin') {
    return {
      ok: false as const,
      response: NextResponse.json({ data: null, error: 'Forbidden' }, { status: 403 }),
    }
  }
  return { ok: true as const }
}

// GET — lista todos los usuarios con su perfil
export async function GET() {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('dashboard_users')
    .select(`id, display_name, role, partner_id, created_at, partners ( name )`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
  return NextResponse.json({ data, error: null })
}

// POST — crear usuario nuevo
export async function POST(req: NextRequest) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const body = await req.json()
  const { email, password, display_name, role, partner_id } = body

  if (!email || !password || !display_name || !role) {
    return NextResponse.json({ data: null, error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const adminClient = createAdminClient()

  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError) return NextResponse.json({ data: null, error: authError.message }, { status: 400 })

  const supabase = await createClient()
  const { data: profile, error: profileError } = await supabase
    .from('dashboard_users')
    .insert({ id: authData.user.id, display_name, role, partner_id: partner_id ?? null })
    .select()
    .single()

  if (profileError) {
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ data: null, error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ data: profile, error: null }, { status: 201 })
}
