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
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center justify-center">
        <div className="grid w-full items-center gap-8 rounded-[34px] border border-white/12 bg-white/6 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr] lg:p-6">
          <section className="rounded-[28px] border border-white/10 bg-[#0d1223]/95 p-7 sm:p-10">
            <img
              src="/meowmates-logo.png"
              alt="Meowmates"
              className="w-full max-w-[360px]"
            />

            <div className="mt-8 space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                Welcome
              </p>
              <h1 className="text-4xl font-black leading-tight">
                Sign in and customize your Meowmate.
              </h1>
              <p className="max-w-lg text-base leading-7 text-white/70">
                Upload your animation images, preview them cleanly, and save
                changes without digging through links or technical settings.
              </p>
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-[#11172b]/95 p-7 sm:p-10">
            <div className="space-y-3">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/45">
                Twitch Login
              </p>
              <h2 className="text-2xl font-bold">Connect your account</h2>
              <p className="text-sm leading-7 text-white/68">
                Use Twitch to access your setup page and manage your pet images.
              </p>
            </div>

            <button
              onClick={handleLogin}
              className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#8b5cf6] via-[#7c3aed] to-[#38bdf8] px-5 py-4 text-base font-bold text-white transition hover:scale-[1.01]"
            >
              Login with Twitch
            </button>

            <div className="mt-6 rounded-2xl border border-white/10 bg-white/4 p-4 text-sm text-white/60">
              You’ll go straight to your Meowmate editor after login.
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
