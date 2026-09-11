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

// PATCH — actualizar perfil de usuario
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const body = await req.json()
  const { display_name, role, partner_id, password } = body

  if (password) {
    const adminClient = createAdminClient()
    const { error } = await adminClient.auth.admin.updateUserById(id, { password })
    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}
  if (display_name !== undefined) updates.display_name = display_name
  if (role !== undefined) updates.role = role
  if (partner_id !== undefined) updates.partner_id = partner_id ?? null

  if (Object.keys(updates).length > 0) {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('dashboard_users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) return NextResponse.json({ data: null, error: error.message }, { status: 500 })
    return NextResponse.json({ data, error: null })
  }

  return NextResponse.json({ data: null, error: null })
}

// DELETE — eliminar usuario
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdmin()
  if (!guard.ok) return guard.response

  const { id } = await params
  const adminClient = createAdminClient()

  const { error } = await adminClient.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ data: null, error: error.message }, { status: 400 })

  return NextResponse.json({ data: { id }, error: null })
}
