import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  context: { params: Promise<{ login: string; code: string }> }
) {
  const params = await context.params
  const login = params.login.toLowerCase()
  const code = params.code

  const { data: profile, error } = await adminSupabase
    .from('meowmate_profiles')
    .select(
      'twitch_login, twitch_display_name, share_code, move_style, idle_url, walk_url, dance_url'
    )
    .eq('twitch_login', login)
    .eq('share_code', code)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  return NextResponse.json({
    twitchLogin: profile.twitch_login,
    displayName: profile.twitch_display_name,
    shareCode: profile.share_code,
    moveStyle: profile.move_style,
    idleUrl: profile.idle_url,
    walkUrl: profile.walk_url,
    danceUrl: profile.dance_url,
  })
}