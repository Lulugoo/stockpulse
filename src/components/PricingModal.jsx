import { useState } from "react";

const CHECK = (
  <svg style={{ flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const X_ICON = (
  <svg style={{ flexShrink: 0, marginTop: 1 }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const FREE_FEATURES = [
  { label: "5 stock lookups / day", included: true },
  { label: "Fundamental scoring", included: true },
  { label: "Favorites & history", included: true },
  { label: "Confidence signals", included: true },
  { label: "Compare stocks", included: false },
  { label: "Unlimited lookups", included: false },
  { label: "Priority data refresh", included: false },
];

const PRO_FEATURES = [
  { label: "Unlimited stock lookups", included: true },
  { label: "Fundamental scoring", included: true },
  { label: "Favorites & history", included: true },
  { label: "Confidence signals", included: true },
  { label: "Compare any two stocks", included: true },
  { label: "Priority data refresh", included: true },
  { label: "Early access to new features", included: true },
];

export default function PricingModal({ dark, onClose }) {
  const [yearly, setYearly] = useState(false);

  const price = yearly ? "$4.08" : "$6.99";
  const btnLabel = yearly ? "Upgrade to Pro — $49/yr" : "Upgrade to Pro — $6.99/mo";

  const textPrimary = dark ? "text-gray-100" : "text-gray-900";
  const textSecondary = dark ? "text-gray-400" : "text-gray-500";
  const freeBg = dark ? "bg-[#444441]" : "bg-gray-50";
  const freeBorder = dark ? "border-white/10" : "border-black/8";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40">
      <div className={`w-full max-w-lg rounded-2xl p-8 relative shadow-xl ${dark ? "bg-[#2C2C2A]" : "bg-white"}`}>
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 rounded-full p-1.5 transition-colors ${dark ? "text-gray-400 hover:bg-white/10" : "text-gray-400 hover:bg-black/5"}`}
          aria-label="Close"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="mb-5 text-center">
          <p className={`text-xs ${textSecondary} mb-1`}>You've reached your daily limit</p>
          <h2 className={`text-lg font-bold ${textPrimary}`}>Unlock full access with Pro</h2>
        </div>

        <div className="mb-5 flex items-center justify-center gap-3">
          <span className={`text-sm font-medium ${!yearly ? textPrimary : textSecondary}`}>Monthly</span>
          <button
            type="button"
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly((y) => !y)}
            className="relative h-6 w-11 rounded-full bg-emerald-500 transition-colors focus:outline-none"
          >
            <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${yearly ? "translate-x-5" : "translate-x-0"}`} />
          </button>
          <span className={`text-sm font-medium ${yearly ? textPrimary : textSecondary}`}>Yearly</span>
          <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">Save 41%</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl border ${freeBorder} ${freeBg} p-5`}>
            <p className={`mb-1 text-[11px] uppercase tracking-wide ${textSecondary}`}>Free</p>
            <p className={`mb-4 text-2xl font-bold ${textPrimary}`}>$0<span className={`text-sm font-normal ${textSecondary}`}>/mo</span></p>
            <ul className="flex flex-col gap-2.5 mb-5">
              {FREE_FEATURES.map((f) => (
                <li key={f.label} className={`flex items-start gap-2 text-xs ${f.included ? textSecondary : `${textSecondary} opacity-40`}`}>
                  <span>{f.included ? CHECK : X_ICON}</span>
                  {f.label}
                </li>
              ))}
            </ul>
            <button disabled className={`w-full rounded-full py-2 text-sm font-medium opacity-40 cursor-default border ${dark ? "border-white/20 text-gray-300" : "border-gray-300 text-gray-500"}`}>
              Current plan
            </button>
          </div>

          <div className="rounded-xl border-2 border-emerald-500 p-5 relative" style={{ background: dark ? "#3a3a38" : "#fff" }}>
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-0.5 text-[11px] font-semibold text-white whitespace-nowrap">Most popular</span>
            <p className="mb-1 text-[11px] uppercase tracking-wide text-emerald-600">Pro</p>
            <div className="mb-0.5">
              <span className={`text-2xl font-bold ${textPrimary}`}>{price}</span>
              <span className={`text-sm ${textSecondary}`}>/mo</span>
            </div>
            <p className={`mb-4 text-[11px] h-4 ${textSecondary}`}>{yearly ? "billed $49/year" : ""}</p>
            <ul className="flex flex-col gap-2.5 mb-5">
              {PRO_FEATURES.map((f) => (
                <li key={f.label} className={`flex items-start gap-2 text-xs ${textPrimary}`}>
                  <span className="text-emerald-500">{CHECK}</span>
                  {f.label}
                </li>
              ))}
            </ul>
            <button
              onClick={() => alert("Stripe coming soon!")}
              className="w-full rounded-full bg-emerald-500 py-2 text-sm font-semibold text-white hover:bg-emerald-600 transition-colors"
            >
              {btnLabel}
            </button>
          </div>
        </div>

        <p className={`mt-4 text-center text-xs ${textSecondary}`}>Cancel anytime. No hidden fees.</p>
      </div>
    </div>
  );
}