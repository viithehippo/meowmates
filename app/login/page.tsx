'use client'

import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const handleLogin = async () => {
    const supabase = createClient()

    await supabase.auth.signInWithOAuth({
      provider: 'twitch',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Meowmates Login</h1>
        <p className="text-sm opacity-80 mb-6">
          Sign in with Twitch to manage your pet animations.
        </p>

        <button
          onClick={handleLogin}
          className="w-full rounded-xl px-4 py-3 border font-medium hover:opacity-90"
        >
          Login with Twitch
        </button>
      </div>
    </main>
  )
}