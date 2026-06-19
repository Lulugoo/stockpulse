export default function UpgradePrompt({ dark, onSignIn, isGuest, remaining, limit, onUpgrade }) {
  return (
    <div
      className={`mt-6 rounded-2xl border p-6 text-center ${
        dark ? "border-amber-500/30 bg-amber-500/10" : "border-amber-400/40 bg-amber-50"
      }`}
    >
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
        <svg className="h-6 w-6 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      </div>

      {isGuest ? (
        <>
          <h3 className={`text-base font-bold ${dark ? "text-gray-100" : "text-gray-900"}`}>
            You've used all {limit} guest lookups
          </h3>
          <p className={`mt-1.5 text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
            Create a free account to get 5 lookups per day.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onSignIn}
              className="w-full rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-600 sm:w-auto"
            >
              Sign up — it's free
            </button>
          </div>
          <p className={`mt-3 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
            Already have an account? <button onClick={onSignIn} className="underline">Sign in</button>
          </p>
        </>
      ) : (
        <>
          <h3 className={`text-base font-bold ${dark ? "text-gray-100" : "text-gray-900"}`}>
            Daily limit reached
          </h3>
          <p className={`mt-1.5 text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
            Free accounts get {limit} stock lookups per day. Resets at midnight.
          </p>
          <div className="mt-4 flex flex-col items-center gap-2 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={onUpgrade}
              className="w-full rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-amber-600 sm:w-auto"
            >
              Upgrade to Pro — $6.99/mo
            </button>
          </div>
          <p className={`mt-3 text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
            Pro includes unlimited lookups, compare mode, and priority data.
          </p>
        </>
      )}
    </div>
  );
}