import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import AuthModal from "../components/AuthModal";
import PricingModal from "../components/PricingModal";

const STEPS = [
  {
    number: 1,
    heading: "Search any stock",
    description:
      "Type a ticker or company name. Autocomplete surfaces results instantly so you can find what you're looking for without knowing the exact symbol.",
    chips: [{ label: "AAPL" }, { label: "NVDA" }, { label: "MSFT" }, { label: "TSLA" }],
  },
  {
    number: 2,
    heading: "We fetch the fundamentals",
    description:
      "StockPulse pulls live data from Alpha Vantage — P/E, P/B, ROE, profit margins, revenue growth, analyst targets, and more.",
    chips: [
      { label: "P/E ratio", color: "value" },
      { label: "P/B ratio", color: "value" },
      { label: "PEG", color: "value" },
      { label: "ROE", color: "quality" },
      { label: "Gross margin", color: "quality" },
      { label: "D/E ratio", color: "quality" },
      { label: "Revenue growth", color: "momentum" },
      { label: "52-week range", color: "momentum" },
    ],
  },
  {
    number: 3,
    heading: "Your stock gets a score",
    description:
      "Our engine weighs each metric across three dimensions to produce a single composite score out of 100.",
    pills: [
      { label: "Value · 35%" },
      { label: "Quality · 40%" },
      { label: "Momentum · 25%" },
    ],
  },
  {
    number: 4,
    heading: "Read the breakdown",
    description:
      "Each metric comes with a tooltip, industry-context warnings, and confidence signals — so you understand exactly what's driving the score, not just the number.",
    chips: [{ label: "Metric chips" }, { label: "Industry warnings" }, { label: "Confidence signals" }],
  },
  {
    number: 5,
    heading: "Save, compare, and share",
    description:
      "Favorite stocks sync to your account. Compare two tickers side by side with Pro. Share any analysis with a single link.",
    chips: [{ label: "Favorites" }, { label: "Side-by-side compare" }, { label: "Share via link" }],
  },
];

const FAQS = [
  {
    question: "Is StockPulse a buy/sell recommendation?",
    answer:
      "No. StockPulse is a research and scoring tool, not financial advice. The score reflects how a stock measures up across fundamental metrics — it doesn't account for your personal situation, risk tolerance, or market timing. Always do your own research before investing.",
  },
  {
    question: "Where does the data come from?",
    answer:
      "All financial data is sourced from Alpha Vantage, which aggregates fundamentals from stock exchanges and financial data providers. Data is fetched in real time when you look up a ticker.",
  },
  {
    question: "How is the score calculated?",
    answer:
      "The composite score is built from three weighted dimensions: Value (35%) covers P/E, P/B, and PEG ratios; Quality (40%) covers ROE, profit margin, gross margin, current ratio, and debt-to-equity; Momentum (25%) covers revenue growth, analyst price targets, 52-week position, and earnings beats. Each metric is scored and combined into a single number out of 100.",
  },
  {
    question: "How many lookups do I get?",
    answer:
      "Guests get 3 lookups per day. Free accounts get 5 per day. Pro subscribers get unlimited lookups with no daily cap.",
  },
  {
    question: "What do I get with Pro?",
    answer:
      "Pro unlocks unlimited daily lookups and the side-by-side stock comparison tool. Plans start at $6.99/month or $49/year (saving 41%). You can cancel anytime from your account settings.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      'Yes, anytime. Hit "Manage plan" in the header to open the Stripe customer portal, where you can cancel, switch plans, or update your billing info. Your Pro access continues until the end of the current billing period.',
  },
];

function Chip({ label, color, dark }) {
  const colorMap = {
    value: dark
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
    quality: dark
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
    momentum: dark
      ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
      : "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const defaultClass = dark
    ? "bg-white/10 text-gray-300 border-white/10"
    : "bg-black/5 text-gray-600 border-black/10";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium border ${color ? colorMap[color] : defaultClass}`}>
      {label}
    </span>
  );
}

function FaqItem({ question, answer, dark }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`border-b last:border-b-0 ${dark ? "border-white/10" : "border-black/10"}`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>{question}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? "rotate-45" : ""} ${dark ? "text-gray-400" : "text-gray-400"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <p className={`pb-4 text-sm leading-relaxed ${dark ? "text-gray-400" : "text-gray-600"}`}>{answer}</p>
      )}
    </div>
  );
}

export default function HowItWorks({ dark }) {
  const [user, setUser] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setUserLoaded(true);
    });
  }, []);

  const handleViewPricing = () => {
    if (user) {
      setShowPricing(true);
    } else {
      setShowAuth(true);
    }
  };

  const pageBg = dark ? "bg-[#2C2C2A]" : "bg-[#F1EFE8]";
  const cardBg = dark ? "bg-[#444441]" : "bg-white";
  const headingColor = dark ? "text-gray-100" : "text-gray-900";
  const textSecondary = dark ? "text-gray-400" : "text-gray-600";
  const borderColor = dark ? "border-white/10" : "border-black/10";
  const lineColor = dark ? "bg-white/10" : "bg-black/10";
  const numBg = dark ? "bg-[#444441] border-white/10 text-gray-400" : "bg-white border-black/10 text-gray-400";

  return (
    <div className={`min-h-screen w-full ${pageBg} transition-colors`}>
      <div className="mx-auto max-w-2xl px-4 py-12">

        {/* Logo */}
        <a href="/" className="inline-flex items-center mb-6 text-xl font-extrabold tracking-tight text-gray-900">
          <span className={dark ? "text-gray-100" : "text-gray-900"}>Stock</span>
          <span className="text-emerald-500">Pulse</span>
        </a>

        <div className={`rounded-2xl ${cardBg} p-8 shadow-sm`}>

          {/* Header */}
          <h1 className={`text-2xl font-bold mb-1 ${headingColor}`}>How it works</h1>
          <p className={`text-sm mb-8 ${textSecondary}`}>
            Score any stock in seconds using the same metrics professionals rely on.
          </p>

          {/* Steps */}
          <div className="flex flex-col">
            {STEPS.map((step, i) => (
              <div key={step.number} className="flex gap-4">
                <div className="flex flex-col items-center flex-shrink-0">
                  <div className={`w-7 h-7 rounded-full border flex items-center justify-center text-xs font-semibold flex-shrink-0 ${numBg}`}>
                    {step.number}
                  </div>
                  {i < STEPS.length - 1 && <div className={`w-px flex-1 mt-2 ${lineColor}`} />}
                </div>
                <div className={`flex-1 ${i < STEPS.length - 1 ? "pb-6" : "pb-0"}`}>
                  <p className={`text-sm font-semibold mb-1 pt-0.5 ${headingColor}`}>{step.heading}</p>
                  <p className={`text-sm leading-relaxed mb-3 ${textSecondary}`}>{step.description}</p>
                  {step.chips && (
                    <div className="flex flex-wrap gap-1.5">
                      {step.chips.map((chip) => <Chip key={chip.label} label={chip.label} color={chip.color} dark={dark} />)}
                    </div>
                  )}
                  {step.pills && (
                    <div className="flex flex-wrap gap-2">
                      {step.pills.map((pill) => (
                        <span key={pill.label} className="text-xs font-medium px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-600">
                          {pill.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className={`border-t my-8 ${borderColor}`} />

          {/* FAQ */}
          <h2 className={`text-sm font-semibold mb-4 ${headingColor}`}>Common questions</h2>
          <div>
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} dark={dark} />
            ))}
          </div>

          {/* CTA */}
          <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row gap-3 ${borderColor}`}>
            <a
              href="/"
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold hover:bg-emerald-600 transition-colors"
            >
              Start analyzing stocks
            </a>
            <button
              onClick={handleViewPricing}
              disabled={!userLoaded}
              className={`inline-flex items-center justify-center px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors disabled:opacity-50 ${dark ? "border-white/20 text-gray-300 hover:bg-white/10" : "border-gray-300 text-gray-700 hover:bg-black/5"}`}
            >
              View pricing
            </button>
          </div>

        </div>
      </div>

      {showAuth && (
        <AuthModal
          dark={dark}
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            setShowPricing(true);
          }}
        />
      )}
      {showPricing && (
        <PricingModal dark={dark} user={user} onClose={() => setShowPricing(false)} />
      )}
    </div>
  );
}
