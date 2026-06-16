// Scores a stock from the data object returned by useStockData.
// Each metric is scored 0-10, then grouped into Value / Quality / Momentum
// categories and combined into a weighted final score with a verdict label.

const scorePE = (pe) => {
  if (pe === null || pe === undefined) return null;
  if (pe < 15) return 10;
  if (pe <= 25) return 7;
  if (pe <= 40) return 4;
  return 1;
};

const scorePB = (pb) => {
  if (pb === null || pb === undefined) return null;
  if (pb < 1) return 10;
  if (pb <= 3) return 7;
  if (pb <= 5) return 4;
  return 1;
};

const scorePEG = (peg) => {
  if (peg === null || peg === undefined) return null;
  if (peg < 1) return 10;
  if (peg <= 2) return 6;
  return 2;
};

const scoreROE = (roe) => {
  if (roe === null || roe === undefined) return null;
  if (roe > 0.2) return 10;
  if (roe >= 0.15) return 7;
  if (roe >= 0.1) return 5;
  return 2;
};

const scoreProfitMargin = (margin) => {
  if (margin === null || margin === undefined) return null;
  if (margin > 0.2) return 10;
  if (margin >= 0.1) return 7;
  if (margin >= 0.05) return 5;
  return 2;
};

const scoreRevenueGrowth = (growth) => {
  if (growth === null || growth === undefined) return null;
  if (growth > 10) return 10;
  if (growth >= 5) return 7;
  if (growth >= 0) return 4;
  return 1;
};

// Average over the non-null scores; returns 0 when no metric is available.
const average = (scores) => {
  const valid = scores.filter((s) => s !== null);
  if (valid.length === 0) return 0;
  const sum = valid.reduce((acc, s) => acc + s, 0);
  return sum / valid.length;
};

const round1 = (n) => Math.round(n * 10) / 10;

const getVerdict = (finalScore) => {
  if (finalScore >= 7.5) return "Strong Signals";
  if (finalScore >= 5.5) return "Mixed Signals";
  if (finalScore >= 3.5) return "Weak Signals";
  return "Poor Signals";
};

export function scoreStock(data) {
  const d = data || {};

  const valueScore = average([
    scorePE(d.peRatio),
    scorePB(d.priceToBookRatio),
    scorePEG(d.pegRatio),
  ]);

  const qualityScore = average([
    scoreROE(d.returnOnEquityTTM),
    scoreProfitMargin(d.profitMargin),
  ]);

  const momentumScore = average([scoreRevenueGrowth(d.revenueGrowthYoY)]);

  const finalScore = round1(
    valueScore * 0.35 + qualityScore * 0.4 + momentumScore * 0.25
  );

  return {
    valueScore: round1(valueScore),
    qualityScore: round1(qualityScore),
    momentumScore: round1(momentumScore),
    finalScore,
    verdict: getVerdict(finalScore),
  };
}

export default scoreStock;
