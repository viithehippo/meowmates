import { NextResponse } from 'next/server'
import { adminSupabase } from '@/lib/supabase/admin'

export async function GET(
  _request: Request,
  context: { params: Promise<{ login: string }> }
) {
  const { login } = await context.params

  const { data: profile, error } = await adminSupabase
    .from('meowmate_profiles')
    .select(
      'twitch_login, move_style, idle_url, walk_url, dance_url'
    )
    .eq('twitch_login', login.toLowerCase())
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!profile) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({
    twitchLogin: profile.twitch_login,
    moveStyle: profile.move_style,
    idleUrl: profile.idle_url,
    walkUrl: profile.walk_url,
    danceUrl: profile.dance_url,
  })
}