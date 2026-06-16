import { useState, useEffect, useRef } from "react";

const API_KEY = import.meta.env.VITE_AV_API_KEY;
const BASE_URL = "https://www.alphavantage.co/query";
const MOCK_MODE = true; // ← flip to false for real data

const MOCK_DATA = {
  symbol: "AAPL",
  name: "Apple Inc",
  industry: "CONSUMER ELECTRONICS",
  sector: "TECHNOLOGY",
  peRatio: 35.2,
  priceToBookRatio: 40.15,
  pegRatio: 2.352,
  returnOnEquityTTM: 1.415,
  debtToEquityRatio: 1.77,
  profitMargin: 0.272,
  grossProfitTTM: 216070996000,
  grossMarginTTM: 0.479,
  currentRatio: 1.07,
  marketCapitalization: 4275929874000,
  analystTargetPrice: 312.72,
  revenueGrowthYoY: 6.42,
  fiftyTwoWeekHigh: 260.10,
  fiftyTwoWeekLow: 164.08,
  fiftyDayMA: 198.45,
  earningsBeatCount: 3,
};

const toNumber = (value) => {
  if (value === undefined || value === null || value === "" || value === "None") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const calcRevenueGrowth = (reports) => {
  if (!Array.isArray(reports) || reports.length < 2) return null;
  const [latest, previous] = reports;
  const current = toNumber(latest?.totalRevenue);
  const prior = toNumber(previous?.totalRevenue);
  if (current === null || prior === null || prior === 0) return null;
  return ((current - prior) / prior) * 100;
};

const calcEarningsBeatCount = (quarterlyEarnings) => {
  if (!Array.isArray(quarterlyEarnings) || quarterlyEarnings.length === 0) return null;
  const quarters = quarterlyEarnings.slice(0, 4);
  return quarters.reduce((count, q) => {
    const actual = toNumber(q?.reportedEPS);
    const estimate = toNumber(q?.estimatedEPS);
    if (actual === null || estimate === null) return count;
    return actual > estimate ? count + 1 : count;
  }, 0);
};

export function useStockData(ticker) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const cache = useRef({});

  useEffect(() => {
    const symbol = ticker?.trim().toUpperCase();
    if (!symbol) return;

    // Mock mode
    if (MOCK_MODE) {
      setData({ ...MOCK_DATA, symbol });
      setLoading(false);
      setError("");
      return;
    }

    if (!API_KEY) {
      setError("Missing Alpha Vantage API key (VITE_AV_API_KEY).");
      setData(null);
      return;
    }

    // Cache hit
    if (cache.current[symbol]) {
      setData(cache.current[symbol]);
      setError("");
      return;
    }

    const controller = new AbortController();
    let active = true;

    const fetchData = async () => {
      setLoading(true);
      setError("");
      setData(null);

      try {
        const overviewRes = await fetch(
          `${BASE_URL}?function=OVERVIEW&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`,
          { signal: controller.signal }
        );
        await delay(1200);
        const incomeRes = await fetch(
          `${BASE_URL}?function=INCOME_STATEMENT&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`,
          { signal: controller.signal }
        );

        if (!overviewRes.ok || !incomeRes.ok) throw new Error("Failed to fetch data.");

        const overview = await overviewRes.json();
        const income = await incomeRes.json();

        if (overview.Note || income.Note || overview.Information || income.Information) {
          throw new Error(overview.Note || income.Note || overview.Information || income.Information);
        }
        if (!overview.Symbol) throw new Error(`No data found for "${symbol}".`);

        await delay(1200);
        const earningsRes = await fetch(
          `${BASE_URL}?function=EARNINGS&symbol=${encodeURIComponent(symbol)}&apikey=${API_KEY}`,
          { signal: controller.signal }
        );
        const earnings = earningsRes.ok ? await earningsRes.json() : {};

        const result = {
          symbol: overview.Symbol,
          name: overview.Name,
          industry: overview.Industry,
          sector: overview.Sector,
          peRatio: toNumber(overview.PERatio),
          priceToBookRatio: toNumber(overview.PriceToBookRatio),
          pegRatio: toNumber(overview.PEGRatio),
          returnOnEquityTTM: toNumber(overview.ReturnOnEquityTTM),
          debtToEquityRatio: toNumber(overview.DebtToEquityRatio),
          profitMargin: toNumber(overview.ProfitMargin),
          grossProfitTTM: toNumber(overview.GrossProfitTTM),
          grossMarginTTM: toNumber(overview.GrossMarginTTM),
          currentRatio: toNumber(overview.CurrentRatio),
          marketCapitalization: toNumber(overview.MarketCapitalization),
          analystTargetPrice: toNumber(overview.AnalystTargetPrice),
          fiftyTwoWeekHigh: toNumber(overview["52WeekHigh"]),
          fiftyTwoWeekLow: toNumber(overview["52WeekLow"]),
          fiftyDayMA: toNumber(overview["50DayMovingAverage"]),
          revenueGrowthYoY: calcRevenueGrowth(income.annualReports),
          earningsBeatCount: calcEarningsBeatCount(earnings.quarterlyEarnings),
        };

        cache.current[symbol] = result;
        if (active) setData(result);

      } catch (err) {
        if (err.name === "AbortError") return;
        if (active) {
          setError(err.message || "Something went wrong.");
          setData(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchData();
    return () => { active = false; controller.abort(); };

  }, [ticker]);

  return { data, loading, error };
}

export default useStockData;