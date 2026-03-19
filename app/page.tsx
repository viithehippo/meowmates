import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-xl w-full rounded-2xl border p-6 shadow-sm text-center">
        <h1 className="text-3xl font-bold mb-3">Meowmates</h1>
        <p className="mb-6">
          Upload your pet animations and connect them to Streamer.bot.
        </p>

        <Link
          href="/login"
          className="inline-block rounded-xl border px-4 py-3 font-medium"
        >
          Go to Login
        </Link>
      </div>
    </main>
  )
}