import { useState, useEffect, useRef } from "react";
import useStockData from "./hooks/useStockData";
import scoreStock from "./utils/scoreStock";

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
  growth: "Revenue Growth YoY: the year-over-year change in annual revenue.",
};

// Returns an industry-specific caution string for a metric, or null.
const metricWarning = (key, data) => {
  const sector = (data.sector || "").toLowerCase();
  const industry = (data.industry || "").toLowerCase();
  const financial = sector.includes("financ") || industry.includes("bank") || industry.includes("insurance");
  const realEstateUtil = sector.includes("real estate") || sector.includes("utilit");
  const retail = sector.includes("retail") || industry.includes("retail") || sector.includes("consumer");
  const tech = sector.includes("technolog") || industry.includes("software") || industry.includes("semiconduct");

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
    { key: "de", name: "D/E", value: fmtNum(data.debtToEquityRatio, 2) },
  ],
  momentum: [
    {
      key: "growth",
      name: "Revenue Growth YoY",
      value: data.revenueGrowthYoY === null ? "—" : `${data.revenueGrowthYoY.toFixed(1)}%`,
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

function MetricChip({ name, value, explanation, warning, dark }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
        dark ? "bg-white/10 text-gray-200" : "bg-black/5 text-gray-700"
      }`}
    >
      <span className={dark ? "text-gray-400" : "text-gray-500"}>{name}</span>
      <span className="font-semibold tabular-nums">{value}</span>
      <span
        title={explanation}
        className={`flex h-4 w-4 cursor-help items-center justify-center rounded-full text-[10px] font-bold ${
          dark ? "bg-white/15 text-gray-300" : "bg-black/10 text-gray-600"
        }`}
      >
        ?
      </span>
      {warning && (
        <span
          title={warning}
          className="flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-amber-500/20 text-[10px] font-bold text-amber-500"
        >
          !
        </span>
      )}
    </span>
  );
}

function CategoryRow({ label, weight, score, dark, chips, data }) {
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
  const searchRef = useRef(null);

  const { data, loading, error } = useStockData(ticker);

  // Debounced SYMBOL_SEARCH autocomplete (fires at 3+ chars).
  useEffect(() => {
  // Mock autocomplete — remove when MOCK_MODE is off
  if (import.meta.env.VITE_AV_API_KEY === undefined || true) {
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
    const keywords = query.trim().toLowerCase();
    if (keywords.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }
    const filtered = MOCK_SUGGESTIONS.filter(
      s => s.symbol.toLowerCase().includes(keywords) ||
           s.name.toLowerCase().includes(keywords)
    ).slice(0, 6);
    setSuggestions(filtered);
    setShowDropdown(filtered.length > 0);
    return;
  }

  // Real API search below (active when MOCK_MODE is off)
  const keywords = query.trim();
  if (keywords.length < 3) {
        setSuggestions([]);
        setShowDropdown(false);
        return;
      }

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

  // Dismiss dropdown on outside click.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadTicker = (symbol) => {
    const clean = symbol.trim().toUpperCase();
    if (!clean) return;
    setTicker(clean);
    setQuery("");
    setSuggestions([]);
    setShowDropdown(false);
    setHistory((prev) => [clean, ...prev.filter((t) => t !== clean)].slice(0, MAX_HISTORY));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loadTicker(query);
  };

  const removeTab = (symbol) => {
    setHistory((prev) => prev.filter((t) => t !== symbol));
  };

  const score = data ? scoreStock(data) : null;
  const vStyle = score ? verdictStyles[score.verdict] : null;
  const metricChips = data ? buildMetricChips(data) : null;

  const pageBg = dark ? "bg-[#2C2C2A] text-gray-100" : "bg-[#F1EFE8] text-gray-900";
  const cardBg = dark ? "bg-[#444441]" : "bg-white";
  const inputBg = dark ? "bg-[#444441] text-gray-100 placeholder-gray-400" : "bg-white text-gray-900 placeholder-gray-400";

  return (
    <div className={`min-h-screen w-full ${pageBg} transition-colors`}>
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-extrabold tracking-tight">
              Stock<span className="text-emerald-500">Pulse</span>
            </span>
          </div>
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
                className={`w-full rounded-full border ${dark ? "border-white/10" : "border-black/10"} ${inputBg} py-3.5 pl-14 pr-5 text-base shadow-sm outline-none focus:ring-2 focus:ring-emerald-500/50`}
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
        {loading && (
          <div className={`mt-6 rounded-2xl ${cardBg} p-6 text-center text-sm ${dark ? "text-gray-300" : "text-gray-600"} shadow-sm`}>
            Loading {ticker}…
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

        {/* Result card */}
        {!loading && !error && data && score && (
          <div className={`mt-6 rounded-2xl ${cardBg} p-6 shadow-sm`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold leading-tight">{data.symbol}</h2>
                <p className={`mt-1 text-base ${dark ? "text-gray-300" : "text-gray-700"}`}>{data.name}</p>
                {data.industry && (
                  <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${dark ? "bg-white/10 text-gray-300" : "bg-black/5 text-gray-600"}`}>
                    {data.industry}
                  </span>
                )}
              </div>
              <div className="text-right">
                <p className="text-3xl font-extrabold tabular-nums">
                  {score.finalScore.toFixed(1)}
                  <span className={`text-base font-medium ${dark ? "text-gray-400" : "text-gray-500"}`}>/10</span>
                </p>
                <span className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${vStyle.badge}`}>
                  {score.verdict}
                </span>
              </div>
            </div>

            {/* Category breakdown */}
            <div className={`mt-4 divide-y ${dark ? "divide-white/10" : "divide-black/5"}`}>
              <CategoryRow label="Value" weight="35%" score={score.valueScore} dark={dark} chips={metricChips.value} data={data} />
              <CategoryRow label="Quality" weight="40%" score={score.qualityScore} dark={dark} chips={metricChips.quality} data={data} />
              <CategoryRow label="Momentum" weight="25%" score={score.momentumScore} dark={dark} chips={metricChips.momentum} data={data} />
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
      </div>
    </div>
  );
}
