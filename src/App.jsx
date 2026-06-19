import { supabase } from './lib/supabase'
import AuthModal from './components/AuthModal'
import { useState, useEffect, useRef } from "react";
import useStockData from "./hooks/useStockData";
import scoreStock from "./utils/scoreStock";
import { useFavorites } from "./hooks/useFavorites"; 
import { useUsage } from "./hooks/useUsage";
import UpgradePrompt from "./components/UpgradePrompt";
import PricingModal from "./components/PricingModal";
import { Routes, Route, useLocation } from "react-router-dom";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsOfService from "./pages/TermsOfService";
import HowItWorks from "./pages/HowItWorks";



const MAX_HISTORY = 5;

const verdictStyles = {
  "Strong Signals": {
    text: "text-emerald-600",
    badge: "bg-emerald-500/15 text-emerald-600",
    bar: "bg-emerald-500",
  },
  "Mixed Signals": {
    text: "text-amber-500",
    badge: "bg-amber-500/15 text-amber-600",
    bar: "bg-amber-500",
  },
  "Weak Signals": {
    text: "text-orange-500",
    badge: "bg-orange-500/15 text-orange-600",
    bar: "bg-orange-500",
  },
  "Poor Signals": {
    text: "text-red-500",
    badge: "bg-red-500/15 text-red-600",
    bar: "bg-red-500",
  },
};

const scoreColor = (score) => {
  if (score >= 7.5) return "bg-emerald-500";
  if (score >= 5.5) return "bg-amber-500";
  if (score >= 3.5) return "bg-orange-500";
  return "bg-red-500";
};

const categoryExplanation = (key, score) => {
  const level = score >= 7.5 ? "strong" : score >= 5.5 ? "fair" : score >= 3.5 ? "weak" : "poor";
  const map = {
    value: {
      strong: "Trades at an attractive valuation relative to earnings and book value.",
      fair: "Reasonably valued, though not a clear bargain.",
      weak: "Looks somewhat expensive on valuation multiples.",
      poor: "Richly valued — you're paying a steep premium for this stock.",
    },
    quality: {
      strong: "Highly profitable with strong returns on equity.",
      fair: "Decent profitability and returns, with room to improve.",
      weak: "Profitability and returns are below average.",
      poor: "Weak margins and poor returns on capital.",
    },
    momentum: {
      strong: "Revenue is growing quickly year over year.",
      fair: "Revenue is growing at a moderate pace.",
      weak: "Revenue growth is sluggish.",
      poor: "Revenue is flat or shrinking year over year.",
    },
  };
  return map[key][level];
};

const buildSignals = (data) => {
  const signals = [];
  const add = (label, tone) => signals.push({ label, tone });

  if (data.peRatio !== null) {
    if (data.peRatio < 15) add(`Low P/E (${data.peRatio.toFixed(1)})`, "good");
    else if (data.peRatio > 40) add(`High P/E (${data.peRatio.toFixed(1)})`, "bad");
  }
  if (data.priceToBookRatio !== null) {
    if (data.priceToBookRatio < 1) add(`Below book value (P/B ${data.priceToBookRatio.toFixed(2)})`, "good");
    else if (data.priceToBookRatio > 5) add(`High P/B (${data.priceToBookRatio.toFixed(1)})`, "bad");
  }
  if (data.pegRatio !== null && data.pegRatio < 1) add(`Cheap vs growth (PEG ${data.pegRatio.toFixed(2)})`, "good");
  if (data.returnOnEquityTTM !== null) {
    if (data.returnOnEquityTTM > 0.2) add(`Strong ROE (${(data.returnOnEquityTTM * 100).toFixed(0)}%)`, "good");
    else if (data.returnOnEquityTTM < 0.1) add(`Low ROE (${(data.returnOnEquityTTM * 100).toFixed(0)}%)`, "bad");
  }
  if (data.profitMargin !== null) {
    if (data.profitMargin > 0.2) add(`High margins (${(data.profitMargin * 100).toFixed(0)}%)`, "good");
    else if (data.profitMargin < 0.05) add(`Thin margins (${(data.profitMargin * 100).toFixed(0)}%)`, "bad");
  }
  if (data.revenueGrowthYoY !== null) {
    if (data.revenueGrowthYoY > 10) add(`Fast revenue growth (${data.revenueGrowthYoY.toFixed(1)}%)`, "good");
    else if (data.revenueGrowthYoY < 0) add(`Declining revenue (${data.revenueGrowthYoY.toFixed(1)}%)`, "bad");
  }

  if (signals.length === 0) add("No standout signals — metrics are middle-of-the-road.", "neutral");
  return signals;
};

const fmtNum = (v, digits = 2) => (v === null || v === undefined ? "—" : v.toFixed(digits));
const fmtPct = (v, digits = 1) =>
  v === null || v === undefined ? "—" : `${(v * 100).toFixed(digits)}%`;

const metricExplanations = {
  pe: "Price-to-Earnings: how much you pay per dollar of annual earnings. Lower can mean cheaper.",
  pb: "Price-to-Book: share price vs. net asset value per share. Below 1 can signal undervaluation.",
  peg: "P/E adjusted for earnings growth. Below 1 suggests growth is cheap relative to price.",
  roe: "Return on Equity: profit generated per dollar of shareholder equity. Higher is better.",
  margin: "Profit Margin: the share of revenue kept as profit after all expenses.",
  de: "Debt-to-Equity: how much debt the company carries vs. equity. Higher means more leverage and risk.",
  grossMargin: "Gross Margin: revenue left after the direct cost of goods sold. Higher means stronger pricing power.",
  currentRatio: "Current Ratio: short-term assets vs. short-term liabilities. Above 1 means bills are comfortably covered.",
  growth: "Revenue Growth YoY: the year-over-year change in annual revenue.",
  analystTarget: "Analyst Target Price: the average price Wall Street analysts expect over the next year.",
};

// Returns an industry-specific caution string for a metric, or null.
const metricWarning = (key, data) => {
  const sector = (data.sector || "").toLowerCase();
  const industry = (data.industry || "").toLowerCase();
  const financial = sector.includes("financ") || industry.includes("bank") || industry.includes("insurance");
  const realEstateUtil = sector.includes("real estate") || sector.includes("utilit");
  const retail = sector.includes("retail") || industry.includes("retail") || sector.includes("consumer");
  const tech = sector.includes("technolog") || industry.includes("software") || industry.includes("semiconduct");

  const grocery = retail || industry.includes("grocer") || industry.includes("food");

  switch (key) {
    case "pe":
      if (financial) return "P/E can be distorted for financials — pair it with P/B and ROE.";
      if (tech && data.peRatio !== null && data.peRatio > 40)
        return "Elevated P/E is common for high-growth tech and isn't necessarily overvalued.";
      return null;
    case "pb":
      if (tech && data.priceToBookRatio !== null && data.priceToBookRatio > 5)
        return "Asset-light tech firms often trade well above book value, so a high P/B may be normal.";
      return null;
    case "de":
      if ((financial || realEstateUtil) && data.debtToEquityRatio !== null && data.debtToEquityRatio > 1)
        return "High leverage is typical for this sector — D/E may overstate the real risk here.";
      return null;
    case "margin":
      if (retail && data.profitMargin !== null && data.profitMargin < 0.1)
        return "Thin margins are normal in retail/consumer — judge them against sector peers.";
      return null;
    case "grossMargin":
      if (grocery && data.grossMarginTTM !== null && data.grossMarginTTM < 0.2)
        return "Thin gross margins are normal for retail/grocery — they make it up on volume.";
      return null;
    case "currentRatio":
      if (grocery && data.currentRatio !== null && data.currentRatio < 1)
        return "A current ratio below 1 is normal for some retailers thanks to fast inventory turnover.";
      return null;
    case "growth":
      if ((realEstateUtil || financial) && data.revenueGrowthYoY !== null && data.revenueGrowthYoY < 5)
        return "Mature sectors like utilities and financials grow slowly — modest growth is expected.";
      return null;
    default:
      return null;
  }
};

const buildMetricChips = (data) => ({
  value: [
    { key: "pe", name: "P/E", value: fmtNum(data.peRatio, 1) },
    { key: "pb", name: "P/B", value: fmtNum(data.priceToBookRatio, 2) },
    { key: "peg", name: "PEG", value: fmtNum(data.pegRatio, 2) },
  ],
  quality: [
    { key: "roe", name: "ROE", value: fmtPct(data.returnOnEquityTTM) },
    { key: "margin", name: "Profit Margin", value: fmtPct(data.profitMargin) },
    { key: "grossMargin", name: "Gross Margin", value: fmtPct(data.grossMarginTTM) },
    { key: "currentRatio", name: "Current Ratio", value: fmtNum(data.currentRatio, 2) },
    { key: "de", name: "D/E", value: fmtNum(data.debtToEquityRatio, 2) },
  ],
  momentum: [
    {
      key: "growth",
      name: "Revenue Growth YoY",
      value: data.revenueGrowthYoY === null ? "—" : `${data.revenueGrowthYoY.toFixed(1)}%`,
    },
    {
      key: "analystTarget",
      name: "Analyst Target",
      value: data.analystTargetPrice === null ? "—" : `$${data.analystTargetPrice.toFixed(2)}`,
    },
  ],
});

function SearchIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function SunIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function MoonIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function ShareIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CheckIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function SplitIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  );
}

function StarIcon({ className, filled }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function Tooltip({ text, dark, children }) {
  return (
    <span className="group/tip relative inline-flex">
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute bottom-full left-1/2 z-[100] mb-2 hidden w-max max-w-[220px] -translate-x-1/2 whitespace-normal rounded-lg border px-3 py-2 text-[12px] font-normal leading-snug shadow-lg group-hover/tip:block ${
          dark ? "border-white/10 bg-[#3a3a38] text-gray-100" : "border-black/5 bg-white text-gray-700"
        }`}
      >
        {text}
        <span
          className={`absolute left-1/2 top-full h-2 w-2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b border-r ${
            dark ? "border-white/10 bg-[#3a3a38]" : "border-black/5 bg-white"
          }`}
        />
      </span>
    </span>
  );
}

function Spinner() {
  return (
    <div className="flex items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500/25 border-t-emerald-500" />
    </div>
  );
}

function MetricChip({ name, value, explanation, warning, dark }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
        dark ? "bg-white/10 text-gray-200" : "bg-black/5 text-gray-700"
      }`}
    >
      <span className={dark ? "text-gray-400" : "text-gray-500"}>{name}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      <Tooltip text={explanation} dark={dark}>
        <span
          className={`flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[10px] font-bold ${
            dark ? "bg-white/15 text-gray-300" : "bg-black/10 text-gray-600"
          }`}
        >
          ?
        </span>
      </Tooltip>
      {warning && (
        <Tooltip text={warning} dark={dark}>
          <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-500">
            !
          </span>
        </Tooltip>
      )}
    </span>
  );
}

function FiftyTwoWeekBar({ low, high, current, dark }) {
  if (low == null || high == null || current == null || high === low) return null;
  const pct = Math.max(0, Math.min(100, ((current - low) / (high - low)) * 100));
  const fill = pct < 50 ? "bg-amber-500" : "bg-emerald-500";
  return (
    <div className="mt-3">
      <div className={`flex justify-between text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}>
        <span>52W Low ${low.toFixed(2)}</span>
        <span>52W High ${high.toFixed(2)}</span>
      </div>
      <div className={`relative mt-1 h-1.5 w-full rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}>
        <div className={`absolute left-0 top-0 h-1.5 rounded-full ${fill}`} style={{ width: `${pct}%` }} />
        <div
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
            dark ? "border-[#444441] bg-gray-100" : "border-white bg-gray-800"
          }`}
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function EarningsBeatChip({ beatCount, dark }) {
  if (beatCount == null) return null;
  const classes =
    beatCount >= 3
      ? "bg-emerald-500/15 text-emerald-600"
      : beatCount === 2
      ? "bg-amber-500/15 text-amber-600"
      : "bg-red-500/15 text-red-600";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${classes}`}>
      Beat {beatCount}/4 quarters
      <Tooltip text="How often the company beat Wall Street earnings estimates over the last 4 quarters." dark={dark}>
        <span className="flex h-4 w-4 cursor-help items-center justify-center rounded-full border border-current text-[10px] font-bold">
          ?
        </span>
      </Tooltip>
    </span>
  );
}

function CompareCatRow({ label, weight, a, b, dark }) {
  const cls = (x, y) =>
    x > y ? "text-emerald-500" : x < y ? "text-red-500" : dark ? "text-gray-200" : "text-gray-700";
  const sides = [
    { v: a, other: b },
    { v: b, other: a },
  ];
  return (
    <div className="py-3">
      <p className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-gray-800"}`}>
        {label} <span className={`font-normal ${dark ? "text-gray-400" : "text-gray-500"}`}>({weight})</span>
      </p>
      <div className="mt-2 grid grid-cols-2 gap-4">
        {sides.map((side, i) => (
          <div key={i}>
            <p className={`text-sm font-bold tabular-nums ${cls(side.v, side.other)}`}>
              {side.v.toFixed(1)}
              <span className="text-xs font-normal opacity-70">/10</span>
            </p>
            <div className={`mt-1 h-1.5 w-full rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}>
              <div
                className={`h-1.5 rounded-full ${scoreColor(side.v)}`}
                style={{ width: `${Math.max(0, Math.min(100, side.v * 10))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryRow({ label, weight, score, dark, chips, data, extra }) {
  return (
    <div className="py-3">
      <div className="flex items-baseline justify-between">
        <p className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-gray-800"}`}>
          {label} <span className={`font-normal ${dark ? "text-gray-400" : "text-gray-500"}`}>({weight})</span>
        </p>
        <p className={`text-sm font-semibold tabular-nums ${dark ? "text-gray-100" : "text-gray-800"}`}>
          {score.toFixed(1)}<span className={`text-xs font-normal ${dark ? "text-gray-400" : "text-gray-500"}`}>/10</span>
        </p>
      </div>
      <div className={`mt-2 h-1.5 w-full rounded-full ${dark ? "bg-white/10" : "bg-black/10"}`}>
        <div className={`h-1.5 rounded-full ${scoreColor(score)}`} style={{ width: `${Math.max(0, Math.min(100, score * 10))}%` }} />
      </div>
      <p className={`mt-2 text-sm ${dark ? "text-gray-400" : "text-gray-600"}`}>
        {categoryExplanation(label.toLowerCase(), score)}
      </p>
      {chips && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chips.map((c) => (
            <MetricChip
              key={c.key}
              name={c.name}
              value={c.value}
              explanation={metricExplanations[c.key]}
              warning={metricWarning(c.key, data)}
              dark={dark}
            />
          ))}
        </div>
      )}
      {extra}
    </div>
  );
}

export default function App() {
  const [dark, setDark] = useState(false);
  const [query, setQuery] = useState("");
  const [ticker, setTicker] = useState("");
  const [history, setHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [tickerB, setTickerB] = useState("");
  const [queryB, setQueryB] = useState("");
  const [suggestionsB, setSuggestionsB] = useState([]);
  const [showDropdownB, setShowDropdownB] = useState(false);
  const searchRef = useRef(null);
  const searchRefB = useRef(null);

  const { data, loading, error } = useStockData(ticker);
  const { data: dataB, loading: loadingB, error: errorB } = useStockData(tickerB);
  const [user, setUser] = useState(null) // ← user defined here
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const { favorites, toggleFavorite } = useFavorites(user);
  const { trackLookup, remaining, isAtLimit, isPro } = useUsage(user);
  const location = useLocation();
  const [pricingIntent, setPricingIntent] = useState(false);

  useEffect(() => {
  if (location.state?.openPricing) {
    if (!user) {
      setPricingIntent(true);  // ← add this
      setShowAuthModal(true);
    } else {
      setShowUpgradeModal(true);
    }
    window.history.replaceState({}, ""); // clear the state so it doesn't re-trigger
    }
  }, [location.state, user]);


  // Authorization stat
  useEffect(() => {
  supabase?.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })
  const { data: { subscription } } = supabase?.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}, [])

  // Deep link: load ?ticker=XYZ on startup.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("ticker");
    if (initial) {
      setTicker(initial.trim().toUpperCase());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced SYMBOL_SEARCH autocomplete (fires at 3+ chars).
  useEffect(() => {
    const keywords = query.trim();
    if (keywords.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
     // Mock autocomplete — remove when MOCK_MODE is off
    const MOCK_SUGGESTIONS = [
      { symbol: "AAPL", name: "Apple Inc" },
      { symbol: "AMZN", name: "Amazon.com Inc" },
      { symbol: "TSLA", name: "Tesla Inc" },
      { symbol: "META", name: "Meta Platforms Inc" },
      { symbol: "NVDA", name: "Nvidia Corporation" },
      { symbol: "GOOGL", name: "Alphabet Inc" },
      { symbol: "MSFT", name: "Microsoft Corporation" },
      { symbol: "KO", name: "Coca-Cola Company" },
      { symbol: "GME", name: "GameStop Corp" },
      { symbol: "JPM", name: "JPMorgan Chase & Co" },
    ];
      const lower = keywords.toLowerCase();
      const filtered = MOCK_SUGGESTIONS.filter(
        s => s.symbol.toLowerCase().includes(lower) ||
         s.name.toLowerCase().includes(lower)
    ).slice(0, 6);
  setSuggestions(filtered);
  setShowDropdown(filtered.length > 0);
  return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
            keywords
          )}&apikey=${import.meta.env.VITE_AV_API_KEY}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        const matches = Array.isArray(json.bestMatches) ? json.bestMatches : [];
        setSuggestions(
          matches.slice(0, 6).map((m) => ({
            symbol: m["1. symbol"],
            name: m["2. name"],
          }))
        );
        setShowDropdown(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

      // Debounced SYMBOL_SEARCH autocomplete for the compare (B) search bar.
    useEffect(() => {
      const keywords = queryB.trim();
      if (keywords.length < 3) {
        setSuggestionsB([]);
        setShowDropdownB(false);
        return;
      }

      const MOCK_SUGGESTIONS = [
        { symbol: "AAPL", name: "Apple Inc" },
        { symbol: "AMZN", name: "Amazon.com Inc" },
        { symbol: "TSLA", name: "Tesla Inc" },
        { symbol: "META", name: "Meta Platforms Inc" },
        { symbol: "NVDA", name: "Nvidia Corporation" },
        { symbol: "GOOGL", name: "Alphabet Inc" },
        { symbol: "MSFT", name: "Microsoft Corporation" },
        { symbol: "KO", name: "Coca-Cola Company" },
        { symbol: "GME", name: "GameStop Corp" },
        { symbol: "JPM", name: "JPMorgan Chase & Co" },
      ];
      const lower = keywords.toLowerCase();
      const filtered = MOCK_SUGGESTIONS.filter(
        s => s.symbol.toLowerCase().includes(lower) ||
            s.name.toLowerCase().includes(lower)
      ).slice(0, 6);
      setSuggestionsB(filtered);
      setShowDropdownB(filtered.length > 0);
      return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://www.alphavantage.co/query?function=SYMBOL_SEARCH&keywords=${encodeURIComponent(
            keywords
          )}&apikey=${import.meta.env.VITE_AV_API_KEY}`,
          { signal: controller.signal }
        );
        const json = await res.json();
        const matches = Array.isArray(json.bestMatches) ? json.bestMatches : [];
        setSuggestionsB(
          matches.slice(0, 6).map((m) => ({
            symbol: m["1. symbol"],
            name: m["2. name"],
          }))
        );
        setShowDropdownB(true);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSuggestionsB([]);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [queryB]);

  // Dismiss dropdowns on outside click.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
      if (searchRefB.current && !searchRefB.current.contains(e.target)) {
        setShowDropdownB(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const loadTicker = async (symbol) => {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;

    const { allowed } = await trackLookup();
    if (!allowed) return; // UpgradePrompt will show via isAtLimit

    setTicker(clean);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setHistory((prev) => [clean, ...prev.filter((t) => t !== clean)].slice(0, MAX_HISTORY));
};

  const removeTab = (symbol) => {
    setHistory((prev) => prev.filter((t) => t !== symbol));
  };

  const removeFavorite = (symbol) => toggleFavorite(symbol);

  const handleShare = (symbol) => {
    const url = `${import.meta.env.VITE_APP_URL || "https://stockpulse-delta-eight.vercel.app"}/?ticker=${symbol}`;
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const loadTickerB = (symbol) => {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    setTickerB(clean);
    setQueryB("");
    setSuggestionsB([]);
    setShowDropdownB(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await loadTicker(query);
  };

  const handleSubmitB = (e) => {
    e.preventDefault();
    loadTickerB(queryB);
  };



  const exitCompare = () => {
    setCompareMode(false);
    setTickerB("");
    setQueryB("");
    setSuggestionsB([]);
    setShowDropdownB(false);
  };

  const score = data ? scoreStock(data) : null;
  const vStyle = score ? verdictStyles[score.verdict] : null;
  const metricChips = data ? buildMetricChips(data) : null;
  const isFavorite = data ? favorites.includes(data.symbol) : false;

  const scoreB = dataB ? scoreStock(dataB) : null;
  const vStyleB = scoreB ? verdictStyles[scoreB.verdict] : null;
  const showCompare = compareMode && data && score && dataB && scoreB;
  const winnerSymbol = showCompare
    ? score.finalScore > scoreB.finalScore
      ? data.symbol
      : scoreB.finalScore > score.finalScore
      ? dataB.symbol
      : null
    : null;

  const pageBg = dark ? "bg-[#2C2C2A] text-gray-100" : "bg-[#F1EFE8] text-gray-900";
  const cardBg = dark ? "bg-[#444441]" : "bg-white";
  const inputBg = dark ? "bg-[#444441] text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-400";

  return (
    <Routes>
      <Route path="/privacy" element={<PrivacyPolicy dark={dark} />} />
      <Route path="/terms" element={<TermsOfService dark={dark} />} />
      <Route path="/refunds" element={<RefundPolicy dark={dark} />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="*" element={
    <div className={`min-h-screen w-full ${pageBg} transition-colors`}>

      <style>{`
        @keyframes spCardEnter {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sp-card-enter { animation: spCardEnter 300ms ease-out; }
      `}</style>
      <div className="mx-auto max-w-3xl px-3 sm:px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight">
              Stock<span className="text-emerald-500">Pulse</span>
            </span>
          </div>
       {user ? (
        <div className="flex items-center gap-2">
          {isPro && (
            <button
              onClick={async () => {
                const res = await fetch("/api/create-portal-session", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ userId: user.id }),
                });
                const { url, error } = await res.json();
                if (url) window.open(url, "_blank");
                else alert("Could not open billing portal: " + error);
              }}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors ${dark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-600 hover:bg-black/5'}`}
            >
              Manage plan
            </button>
          )}
          <button
            onClick={() => supabase.auth.signOut()}
            className="rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold bg-emerald-500 text-white"
            title="Sign out"
          >
            {user.email?.[0].toUpperCase()}
          </button>
        </div>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            className={`text-sm font-medium px-4 py-2 rounded-full border-1.5 ${dark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-300 text-gray-700 hover:bg-black/5'}`}
          >
            Sign in
          </button>
)}
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            aria-label="Toggle dark mode"
            className={`rounded-full p-2 transition-colors ${dark ? "bg-white/10 hover:bg-white/20 text-amber-300" : "bg-black/5 hover:bg-black/10 text-gray-700"}`}
          >
            {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
          </button>
        </header>

        {/* Search */}
        <div ref={searchRef} className="relative mt-6">
          <form onSubmit={handleSubmit}>
            <div className="relative">
              <SearchIcon className={`pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 ${dark ? "text-gray-400" : "text-gray-500"}`} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                placeholder="Search by ticker or company name..."
                className={`w-full rounded-full border ${dark ? "border-white/10" : "border-gray-300"} ${inputBg} py-3.5 pl-14 pr-5 text-base shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/50`}
              />
            </div>
          </form>

          {showDropdown && suggestions.length > 0 && (
            <ul className={`absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-[#444441]" : "border-black/10 bg-white"} shadow-lg`}>
              {suggestions.map((s) => (
                <li key={s.symbol}>
                  <button
                    type="button"
                    onClick={() => loadTicker(s.symbol)}
                    className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                  >
                    <span className={`font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>{s.symbol}</span>
                    <span className={`truncate text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{s.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Compare search */}
        {compareMode && (
          <div ref={searchRefB} className="relative mt-3">
            <p className={`mb-1 ml-2 text-xs font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>Compare with...</p>
            <form onSubmit={handleSubmitB}>
              <div className="relative">
                <SplitIcon className={`pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 ${dark ? "text-gray-400" : "text-gray-500"}`} />
                <input
                  type="text"
                  value={queryB}
                  onChange={(e) => setQueryB(e.target.value)}
                  onFocus={() => suggestionsB.length > 0 && setShowDropdownB(true)}
                  placeholder="Compare with another ticker or company..."
                  className={`w-full rounded-full border ${dark ? "border-white/10" : "border-gray-300"} ${inputBg} py-3.5 pl-14 pr-5 text-base shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/50`}
                />
              </div>
            </form>

            {showDropdownB && suggestionsB.length > 0 && (
              <ul className={`absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border ${dark ? "border-white/10 bg-[#444441]" : "border-black/10 bg-white"} shadow-lg`}>
                {suggestionsB.map((s) => (
                  <li key={s.symbol}>
                    <button
                      type="button"
                      onClick={() => loadTickerB(s.symbol)}
                      className={`flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors ${dark ? "hover:bg-white/10" : "hover:bg-black/5"}`}
                    >
                      <span className={`font-semibold ${dark ? "text-gray-100" : "text-gray-900"}`}>{s.symbol}</span>
                      <span className={`truncate text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {loadingB && tickerB && !dataB && (
              <div className="mt-3">
                <Spinner />
              </div>
            )}
            {!loadingB && errorB && (
              <div className="mt-3 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-500">
                {errorB}
              </div>
            )}
          </div>
        )}

        {/* Favorites */}
        {favorites.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {favorites.map((t) => (
              <div
                key={t}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  t === ticker
                    ? "bg-amber-500 text-white"
                    : dark
                    ? "bg-amber-400/15 text-amber-300 hover:bg-amber-400/25"
                    : "bg-amber-400/20 text-amber-700 hover:bg-amber-400/30"
                }`}
              >
                <StarIcon className="h-3.5 w-3.5" filled />
                <button type="button" onClick={() => loadTicker(t)} className="font-semibold">
                  {t}
                </button>
                <button
                  type="button"
                  onClick={() => removeFavorite(t)}
                  aria-label={`Remove ${t} from favorites`}
                  className="opacity-60 hover:opacity-100"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Tab history */}
        {history.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {history.map((t) => (
              <div
                key={t}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  t === ticker
                    ? "bg-emerald-500 text-white"
                    : dark
                    ? "bg-white/10 text-gray-200 hover:bg-white/20"
                    : "bg-black/5 text-gray-700 hover:bg-black/10"
                }`}
              >
                <button type="button" onClick={() => loadTicker(t)} className="font-semibold">
                  {t}
                </button>
                <button
                  type="button"
                  onClick={() => removeTab(t)}
                  aria-label={`Remove ${t}`}
                  className="opacity-60 hover:opacity-100"
                >
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* States */}
        {isAtLimit && (
          <UpgradePrompt
            dark={dark}
            onSignIn={() => setShowAuthModal(true)}
            isGuest={!user}
            limit={user ? 5 : 3}
            remaining={remaining}
            onUpgrade={() => setShowUpgradeModal(true)}
          />
        )}

        {loading && (
          <div className={`mt-6 rounded-2xl ${cardBg} p-10 shadow-sm`}>
            <Spinner />
          </div>
        )}

        {!loading && error && (
          <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && !data && (
          <div className={`mt-10 text-center text-sm ${dark ? "text-gray-400" : "text-gray-500"}`}>
            Search for a ticker to see its fundamental score.
          </div>
        )}

        {/* Compare view */}
        {showCompare && (
          <div className={`sp-card-enter relative mt-6 rounded-2xl ${cardBg} p-6 shadow-sm`}>
            <button
              type="button"
              onClick={exitCompare}
              aria-label="Exit compare mode"
              className={`absolute right-4 top-4 rounded-full p-1.5 transition-colors ${
                dark ? "text-gray-400 hover:bg-white/10" : "text-gray-500 hover:bg-black/5"
              }`}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-center text-sm font-bold text-emerald-600">
              {winnerSymbol ? `${winnerSymbol} has stronger fundamentals` : "Evenly matched fundamentals"}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              {[
                { d: data, s: score, st: vStyle },
                { d: dataB, s: scoreB, st: vStyleB },
              ].map((col, i) => (
                <div key={i} className="text-center">
                  <h2 className={`text-2xl font-bold leading-tight ${dark ? "text-white" : "text-gray-900"}`}>{col.d.symbol}</h2>
                  <p className={`mt-0.5 truncate text-sm ${dark ? "text-gray-300" : "text-gray-700"}`}>{col.d.name}</p>
                  <p className="mt-2 text-3xl font-extrabold tabular-nums">
                    {col.s.finalScore.toFixed(1)}
                    <span className={`text-base font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>/10</span>
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${col.st.badge}`}>
                    {col.s.verdict}
                  </span>
                </div>
              ))}
            </div>

            <div className={`mt-4 divide-y ${dark ? "divide-white/10" : "divide-black/5"}`}>
              <CompareCatRow label="Value" weight="35%" a={score.valueScore} b={scoreB.valueScore} dark={dark} />
              <CompareCatRow label="Quality" weight="40%" a={score.qualityScore} b={scoreB.qualityScore} dark={dark} />
              <CompareCatRow label="Momentum" weight="25%" a={score.momentumScore} b={scoreB.momentumScore} dark={dark} />
            </div>
          </div>
        )}

        {/* Result card */}
        {!loading && !error && data && score && !showCompare && (
          <div key={data.symbol} className={`sp-card-enter relative mt-6 rounded-2xl ${cardBg} p-6 shadow-sm`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 className={`text-3xl font-bold leading-tight ${dark ? "text-white" : "text-gray-900"}`}>{data.symbol}</h2>
                <p className={`mt-1 text-base ${dark ? "text-gray-300" : "text-gray-700"}`}>{data.name}</p>
                {data.industry && (
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium max-w-[200px] truncate ${dark ? "bg-white/10 text-gray-300" : "bg-black/5 text-gray-600"}`}>
                    {data.industry}
                  </span>
                )}
              </div>
              <div className="flex items-start gap-3 absolute top-6 right-6 sm:relative sm:top-auto sm:right-auto">
                <button
                  type="button"
                  onClick={() => toggleFavorite(data.symbol)}
                  aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
                  aria-pressed={isFavorite}
                  className={`mt-0 rounded-full p-2 transition-colors ${
                    isFavorite
                      ? "text-amber-500 hover:bg-amber-500/10"
                      : dark
                      ? "text-gray-400 hover:bg-white/10"
                      : "text-gray-400 hover:bg-black/5"
                  }`}
                >
                  <StarIcon className="h-5 w-5" filled={isFavorite} />
                </button>
                <div className="mt-1 flex items-center gap-1">
                  {copied && <span className="text-xs font-medium text-emerald-500">Copied!</span>}
                  <button
                    type="button"
                    onClick={() => handleShare(data.symbol)}
                    aria-label="Copy share link"
                    className={`rounded-full p-2 transition-colors ${
                      copied
                        ? "text-emerald-500 hover:bg-emerald-500/10"
                        : dark
                        ? "text-gray-400 hover:bg-white/10"
                        : "text-gray-400 hover:bg-black/5"
                    }`}
                  >
                    {copied ? <CheckIcon className="h-5 w-5" /> : <ShareIcon className="h-5 w-5" />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                  if (compareMode) {
                    exitCompare();
                  } else if (!isPro) {
                    setShowUpgradeModal(true);
                  } else {
                    setCompareMode(true);
                  }
                  }}
                  aria-label="Compare with another stock"
                  aria-pressed={compareMode}
                  className={`mt-1 rounded-full p-2 transition-colors ${
                    compareMode
                      ? "text-emerald-500 hover:bg-emerald-500/10"
                      : dark
                      ? "text-gray-400 hover:bg-white/10"
                      : "text-gray-400 hover:bg-black/5"
                  }`}
                >
                  <SplitIcon className="h-5 w-5" />
                </button>
                <div className="text-left sm:text-right">
                  <p className="text-3xl font-extrabold tabular-nums">
                    {score.finalScore.toFixed(1)}
                    <span className={`text-base font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>/10</span>
                  </p>
                  <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${vStyle.badge}`}>
                    {score.verdict}
                  </span>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className={`mt-4 divide-y ${dark ? "divide-white/10" : "divide-black/5"}`}>
              <CategoryRow label="Value" weight="35%" score={score.valueScore} dark={dark} chips={metricChips.value} data={data} />
              <CategoryRow label="Quality" weight="40%" score={score.qualityScore} dark={dark} chips={metricChips.quality} data={data} />
              <CategoryRow
                label="Momentum"
                weight="25%"
                score={score.momentumScore}
                dark={dark}
                chips={metricChips.momentum}
                data={data}
                extra={
                  <>
                    <FiftyTwoWeekBar
                      low={data.fiftyTwoWeekLow}
                      high={data.fiftyTwoWeekHigh}
                      current={data.fiftyDayMA}
                      dark={dark}
                    />
                    {data.earningsBeatCount != null && (
                      <div className="mt-3">
                        <EarningsBeatChip beatCount={data.earningsBeatCount} dark={dark} />
                      </div>
                    )}
                  </>
                }
              />
            </div>

            {/* Confidence signals */}
            <div className={`mt-5 border-t pt-4 ${dark ? "border-white/10" : "border-black/5"}`}>
              <h3 className={`text-sm font-semibold ${dark ? "text-gray-100" : "text-gray-800"}`}>Confidence Signals</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {buildSignals(data).map((s, i) => (
                  <span
                    key={i}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium ${
                      s.tone === "good"
                        ? "bg-emerald-500/15 text-emerald-600"
                        : s.tone === "bad"
                        ? "bg-red-500/15 text-red-600"
                        : dark
                        ? "bg-white/10 text-gray-300"
                        : "bg-black/5 text-gray-600"
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <p className={`mt-8 text-center text-xs ${dark ? "text-gray-500" : "text-gray-400"}`}>
        Based on fundamental metrics only. Not investment advice.
        </p>
        <div className={`mt-3 flex items-center justify-center gap-4 text-xs ${dark ? "text-gray-500" : "text-gray-500"}`}>
          <a href="/privacy" target="_blank" rel="noopener noreferrer" className="hover:underline">Privacy</a>
          <span>·</span>
          <a href="/terms" target="_blank" rel="noopener noreferrer" className="hover:underline">Terms</a>
          <span>·</span>
          <a href="/refunds" target="_blank" rel="noopener noreferrer" className="hover:underline">Refunds</a>
          <span>·</span>
          <a href="/how-it-works" target="_blank" rel="noopener noreferrer" className="hover:underline">How it works</a>
        </div>
      </div>
      {showAuthModal && (
        <AuthModal
          dark={dark}
          onClose={() => { setShowAuthModal(false); setPricingIntent(false); }}
          onSuccess={() => {
            if (pricingIntent) {
              setPricingIntent(false);
              setShowUpgradeModal(true);
            }
          }}
        />
      )}
      {showUpgradeModal && (
        <PricingModal dark={dark} onClose={() => setShowUpgradeModal(false)} user={user} />
      )}
    </div>
      } />
    </Routes>
  );
}
