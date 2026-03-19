import Link from 'next/link'

const highlights = [
  'Upload your pet animations',
  'Preview each pose before saving',
  'Keep your Meowmate ready for stream',
]

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 sm:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl flex-col justify-center">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-8">
            <img
              src="/meowmates-logo.png"
              alt="Meowmates"
              className="w-full max-w-[520px] drop-shadow-[0_12px_40px_rgba(0,0,0,0.45)]"
            />

            <div className="space-y-4">
              <h1 className="max-w-2xl text-4xl font-black leading-tight sm:text-5xl">
                Build your stream pet in a few clicks.
              </h1>
              <p className="max-w-xl text-lg leading-8 text-white/72">
                Sign in with Twitch, upload your idle, walk, and dance art, then
                save everything in one clean place.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {highlights.map((item) => (
                <div
                  key={item}
                  className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-sm text-white/82 backdrop-blur"
                >
                  {item}
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-4 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-orange-400 via-amber-300 to-sky-400 px-6 py-3 font-bold text-slate-950 transition hover:scale-[1.01]"
              >
                Login with Twitch
              </Link>
            </div>
          </section>

          <section className="rounded-[32px] border border-white/12 bg-white/6 p-5 shadow-[0_20px_80px_rgba(0,0,0,0.28)] backdrop-blur-xl">
            <div className="rounded-[26px] border border-white/10 bg-[#0f1426]/95 p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">
                    Meowmates
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Viewer Setup</h2>
                </div>
                <div className="rounded-full border border-emerald-300/25 bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-200">
                  Quick Setup
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {['Idle', 'Walk', 'Dance'].map((label) => (
                  <div
                    key={label}
                    className="rounded-3xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="mb-4 flex aspect-square items-center justify-center rounded-2xl border border-dashed border-white/14 bg-[#11182e] text-center text-sm text-white/40">
                      {label}
                      <br />
                      Preview
                    </div>
                    <p className="text-center text-sm font-semibold text-white/88">
                      {label} slot
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
