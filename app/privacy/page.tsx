export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#090909] px-6 py-12 text-white">
      <div className="mx-auto max-w-3xl rounded-[28px] border border-white/10 bg-white/5 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.35)]">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-white/45">
          Meow Mates
        </p>
        <h1 className="mt-3 text-4xl font-black">Privacy Notice</h1>
        <p className="mt-4 text-base leading-7 text-white/72">
          Meow Mates uses limited Twitch account and submission data to operate the
          extension, identify who submitted content, run moderation, and display
          approved pets on a Twitch channel.
        </p>

        <div className="mt-8 space-y-5 text-sm leading-7 text-white/75">
          <section>
            <h2 className="text-lg font-bold text-white">What we collect</h2>
            <p>
              We collect the Twitch extension user ID, Twitch login, display name,
              channel ID, role information needed for moderation, and the image
              files a viewer submits for idle, walk, or dance animations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">How we use it</h2>
            <p>
              We use this information to link a submission to the correct Twitch
              user, hold submissions for moderation, show the submitter name next
              to approved content, and let broadcasters or moderators approve,
              reject, or remove content.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">When content becomes public</h2>
            <p>
              Submitted content is private and pending by default. It only becomes
              visible to other viewers after a broadcaster or moderator approves it.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Retention and removal</h2>
            <p>
              Broadcasters or moderators can remove published content at any time.
              You may also update your submission, which replaces the prior pending
              or approved assets associated with your Twitch account for that
              channel.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white">Contact</h2>
            <p>
              For privacy questions, contact: <span className="font-semibold text-white">you@example.com</span>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
