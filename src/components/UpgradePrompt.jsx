export default function UpgradePrompt({ dark, onSignIn, isGuest, remaining, limit }) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-6 text-center ${
        dark
          ? "border-amber-500/30 bg-amber-500/10"
          : "border-amber-400/40 bg-amber-50"
      }`}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
        <svg
          className="h-6 w-6 text-amber-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>
      <h3 className={`text-base font-bold ${dark ? "text-gray-100" : "text-gray-900"}`}>
        {isGuest ? `You've used all ${limit} free lookups` : `Daily limit reached`}
      </h3>
      <p className={`mt-1.5 text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
        {isGuest
          ? "Sign in for 5 free lookups per day, or go Pro for unlimited access."
          : `Free accounts get ${limit} stock lookups per day. Resets at midnight.`}
      </p>
      <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
        {isGuest && (
          <button
            type="button"
            onClick={onSignIn}
            className={`w-full rounded-full px-5 py-2.5 text-sm font-semibold transition-colors sm:w-auto ${
              dark ? "bg-white/10 text-gray-100 hover:bg-white/20" : "bg-black/5 text-gray-800 hover:bg-black/10"
            }`}
          >
            Sign in — it's free
          </button>
        )}
        <button
          type="button"
          onClick={() => alert("Stripe coming soon!")}
          className="w-full rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 sm:w-auto"
        >
          Upgrade to Pro — $6.99/mo
        </button>
      </div>
      <p className={`mt-3 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
        Pro includes unlimited lookups, compare mode, and priority data.
      </p>
    </div>
  );
}