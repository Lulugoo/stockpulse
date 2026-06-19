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
      { label: "P/E ratio", color: "blue" },
      { label: "P/B ratio", color: "blue" },
      { label: "PEG", color: "blue" },
      { label: "ROE", color: "teal" },
      { label: "Gross margin", color: "teal" },
      { label: "D/E ratio", color: "teal" },
      { label: "Revenue growth", color: "purple" },
      { label: "52-week range", color: "purple" },
    ],
  },
  {
    number: 3,
    heading: "Your stock gets a score",
    description:
      "Our engine weighs each metric across three dimensions to produce a single composite score out of 100.",
    pills: [
      { label: "Value · 35%", color: "blue" },
      { label: "Quality · 40%", color: "purple" },
      { label: "Momentum · 25%", color: "teal" },
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

const chipColorClasses = {
  blue: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-700",
  teal: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-900 dark:text-teal-200 dark:border-teal-700",
  purple: "bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700",
};

const pillColorClasses = {
  blue: "bg-blue-50 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  teal: "bg-teal-50 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  purple: "bg-purple-50 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

function Chip({ label, color }) {
  const colorClass = color
    ? chipColorClasses[color]
    : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs border ${colorClass}`}>
      {label}
    </span>
  );
}

function FaqItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-t border-gray-200 dark:border-gray-700">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex justify-between items-center gap-4 py-4 text-left"
        aria-expanded={open}
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{question}</span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-45" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

export default function HowItWorks() {
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-16">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-2">How it works</p>
          <h1 className="text-3xl font-medium text-gray-900 dark:text-gray-100 mb-3">
            Smarter stock analysis, instantly
          </h1>
          <p className="text-base text-gray-500 dark:text-gray-400 leading-relaxed">
            StockPulse scores any stock in seconds using the same metrics professionals rely on — no spreadsheets needed.
          </p>
        </div>

        {/* Steps */}
        <div className="flex flex-col">
          {STEPS.map((step, i) => (
            <div key={step.number} className="flex gap-5">
              <div className="flex flex-col items-center flex-shrink-0">
                <div className="w-8 h-8 rounded-full border border-gray-200 dark:border-gray-700 flex items-center justify-center text-xs font-medium text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-950 z-10">
                  {step.number}
                </div>
                {i < STEPS.length - 1 && <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-2" />}
              </div>
              <div className={`pb-8 flex-1 ${i === STEPS.length - 1 ? "pb-0" : ""}`}>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 pt-1">{step.heading}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-3">{step.description}</p>
                {step.chips && (
                  <div className="flex flex-wrap gap-1.5">
                    {step.chips.map((chip) => <Chip key={chip.label} label={chip.label} color={chip.color} />)}
                  </div>
                )}
                {step.pills && (
                  <div className="flex flex-wrap gap-2">
                    {step.pills.map((pill) => (
                      <span key={pill.label} className={`text-xs font-medium px-3 py-1 rounded-full ${pillColorClasses[pill.color]}`}>
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
        <div className="border-t border-gray-200 dark:border-gray-700 my-12" />

        {/* FAQ */}
        <div>
          <p className="text-xs font-medium tracking-widest text-gray-400 uppercase mb-2">FAQ</p>
          <h2 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-6">Common questions</h2>
          <div className="flex flex-col">
            {FAQS.map((faq) => <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />)}
            <div className="border-t border-gray-200 dark:border-gray-700" />
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
          <a
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
          >
            Start analyzing stocks
          </a>
          <button
            onClick={handleViewPricing}
            disabled={!userLoaded}
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
          >
            View pricing
          </button>
        </div>

      </div>

      {showAuth && (
        <AuthModal
          onClose={() => setShowAuth(false)}
          onSuccess={() => {
            setShowAuth(false);
            setShowPricing(true);
          }}
        />
      )}

      {showPricing && (
        <PricingModal user={user} onClose={() => setShowPricing(false)} />
      )}
    </div>
  );
}
