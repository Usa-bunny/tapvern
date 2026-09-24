import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const formatUsernameToEmail = (username: string) => {
  return username.includes('@') ? username : `${username.toLowerCase().replace(/\s/g, '')}@tapvern.local`
}

export async function POST(req: NextRequest) {
  try {
    const { student_id, parent_name, parent_username, parent_password } = await req.json()
    if (!parent_username || !parent_password) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 })
    }

    const dummyEmail = formatUsernameToEmail(parent_username)

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: dummyEmail,
      password: parent_password,
      email_confirm: true,
    })
    if (authError) throw authError

    const parentId = authData.user.id

    const { error: profileError } = await supabase.from('profiles').insert([{
      id: parentId,
      role: 'parent',
      name: parent_name,
      email: dummyEmail
    }])
    if (profileError) throw profileError

    if (student_id) {
      const { error: linkError } = await supabase.from('students').update({ parent_id: parentId }).eq('id', student_id)
      if (linkError) throw linkError
    }

    return NextResponse.json({ success: true, parent_id: parentId })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { parent_id, new_password, parent_name, parent_username } = await req.json()
    if (!parent_id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })

    const authUpdates: any = {}
    let dummyEmail = ""
    
    if (new_password) authUpdates.password = new_password
    if (parent_username) {
      dummyEmail = formatUsernameToEmail(parent_username)
      authUpdates.email = dummyEmail
    }

    if (Object.keys(authUpdates).length > 0) {
      const { error: authError } = await supabase.auth.admin.updateUserById(parent_id, authUpdates)
      if (authError) throw authError
    }

    const profileUpdates: any = {}
    if (parent_name) profileUpdates.name = parent_name
    if (dummyEmail) profileUpdates.email = dummyEmail

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabase.from('profiles').update(profileUpdates).eq('id', parent_id)
      if (profileError) throw profileError
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { parent_id } = await req.json()
    if (!parent_id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })

    await supabase.from('students').update({ parent_id: null }).eq('parent_id', parent_id)

    const { error: authError } = await supabase.auth.admin.deleteUser(parent_id)
    if (authError) throw authError

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}