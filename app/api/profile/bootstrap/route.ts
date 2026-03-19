import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const twitchUserId =
    user.user_metadata?.provider_id ||
    user.user_metadata?.sub ||
    user.user_metadata?.['custom_claims']?.user_id ||
    null

  const twitchLogin =
    user.user_metadata?.preferred_username ||
    user.user_metadata?.name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.nickname ||
    null

  const twitchDisplayName =
    user.user_metadata?.nickname ||
    user.user_metadata?.preferred_username ||
    user.user_metadata?.name ||
    twitchLogin ||
    'Unknown User'

  if (!twitchUserId || !twitchLogin) {
    return NextResponse.json(
      { error: 'Missing Twitch metadata on authenticated user.' },
      { status: 400 }
    )
  }

  const normalizedLogin = String(twitchLogin).toLowerCase()

  const { data: existing, error: existingError } = await supabase
    .from('meowmate_profiles')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    return NextResponse.json({ error: existingError.message }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ profile: existing })
  }

  let shareCode = ''
  let createdProfile = null
  let lastError: string | null = null

  for (let i = 0; i < 5; i++) {
    const { data: codeData, error: codeError } = await supabase.rpc(
      'generate_meowmate_code',
      { code_length: 8 }
    )

    if (codeError || !codeData) {
      lastError = codeError?.message || 'Failed to generate share code.'
      continue
    }

    shareCode = codeData

    const { data, error } = await supabase
      .from('meowmate_profiles')
      .insert({
        user_id: user.id,
        twitch_user_id: String(twitchUserId),
        twitch_login: normalizedLogin,
        twitch_display_name: String(twitchDisplayName),
        share_code: shareCode,
        move_style: 'normal',
      })
      .select('*')
      .single()

    if (!error) {
      createdProfile = data
      break
    }

    lastError = error.message

    if (!error.message.toLowerCase().includes('duplicate')) {
      break
    }
  }

  if (!createdProfile) {
    return NextResponse.json(
      { error: lastError || 'Failed to create profile.' },
      { status: 500 }
    )
  }

  return NextResponse.json({ profile: createdProfile })
}