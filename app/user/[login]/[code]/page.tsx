import { notFound } from 'next/navigation'
import { adminSupabase } from '@/lib/supabase/admin'

export default async function PublicUserPage({
  params,
}: {
  params: Promise<{ login: string; code: string }>
}) {
  const { login, code } = await params

  const { data: profile, error } = await adminSupabase
    .from('meowmate_profiles')
    .select(
      'twitch_login, twitch_display_name, share_code, move_style, idle_url, walk_url, dance_url'
    )
    .eq('twitch_login', login.toLowerCase())
    .eq('share_code', code)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  if (!profile) {
    notFound()
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto rounded-2xl border p-6 shadow-sm space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{profile.twitch_display_name}</h1>
          <p className="opacity-80">@{profile.twitch_login}</p>
        </div>

        <div className="rounded-xl border p-4 space-y-2">
          <p><strong>Share Code:</strong> {profile.share_code}</p>
          <p><strong>Move Style:</strong> {profile.move_style}</p>
        </div>

        <div className="rounded-xl border p-4 space-y-3">
          <div>
            <p className="font-semibold">Idle</p>
            <p className="break-all text-sm">{profile.idle_url || 'Not set'}</p>
          </div>
          <div>
            <p className="font-semibold">Walk</p>
            <p className="break-all text-sm">{profile.walk_url || 'Not set'}</p>
          </div>
          <div>
            <p className="font-semibold">Dance</p>
            <p className="break-all text-sm">{profile.dance_url || 'Not set'}</p>
          </div>
        </div>
      </div>
    </main>
  )
}