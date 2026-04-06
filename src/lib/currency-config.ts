type CurrencyRanges = {
  code: string;
  symbol: string;
  revenue: Record<string, string>;
  askingPrice: Record<string, string>;
};

/**
 * Approximate local-currency equivalents for each revenue / asking-price
 * bracket. Keys match the form value stored in the DB (e.g. "under_5k").
 * "pre_revenue" is excluded because its label is language-dependent
 * and comes from the dictionary.
 *
 * Rates used (approximate, rounded for friendly UX):
 *   MXN ≈ 17   BRL ≈ 5.5   COP ≈ 4 200   CLP ≈ 950
 *   ARS ≈ 1 200 (volatile — rounded aggressively)   PEN ≈ 3.75
 */

const usd: CurrencyRanges = {
  code: "USD",
  symbol: "US$",
  revenue: {
    under_5k: "< US$5K",
    "5k_20k": "US$5K – US$20K",
    "20k_50k": "US$20K – US$50K",
    "50k_plus": "US$50K+",
  },
  askingPrice: {
    under_100k: "< US$100K",
    "100k_250k": "US$100K – US$250K",
    "250k_500k": "US$250K – US$500K",
    "500k_1m": "US$500K – US$1M",
    "1m_plus": "US$1M+",
  },
};

const mxn: CurrencyRanges = {
  code: "MXN",
  symbol: "MX$",
  revenue: {
    under_5k: "< MX$100K",
    "5k_20k": "MX$100K – MX$350K",
    "20k_50k": "MX$350K – MX$850K",
    "50k_plus": "MX$850K+",
  },
  askingPrice: {
    under_100k: "< MX$2M",
    "100k_250k": "MX$2M – MX$4M",
    "250k_500k": "MX$4M – MX$9M",
    "500k_1m": "MX$9M – MX$17M",
    "1m_plus": "MX$17M+",
  },
};

const brl: CurrencyRanges = {
  code: "BRL",
  symbol: "R$",
  revenue: {
    under_5k: "< R$25K",
    "5k_20k": "R$25K – R$100K",
    "20k_50k": "R$100K – R$250K",
    "50k_plus": "R$250K+",
  },
  askingPrice: {
    under_100k: "< R$500K",
    "100k_250k": "R$500K – R$1,5M",
    "250k_500k": "R$1,5M – R$2,5M",
    "500k_1m": "R$2,5M – R$5M",
    "1m_plus": "R$5M+",
  },
};

const cop: CurrencyRanges = {
  code: "COP",
  symbol: "COP$",
  revenue: {
    under_5k: "< COP$20M",
    "5k_20k": "COP$20M – COP$80M",
    "20k_50k": "COP$80M – COP$200M",
    "50k_plus": "COP$200M+",
  },
  askingPrice: {
    under_100k: "< COP$400M",
    "100k_250k": "COP$400M – COP$1.000M",
    "250k_500k": "COP$1.000M – COP$2.000M",
    "500k_1m": "COP$2.000M – COP$4.000M",
    "1m_plus": "COP$4.000M+",
  },
};

const clp: CurrencyRanges = {
  code: "CLP",
  symbol: "CLP$",
  revenue: {
    under_5k: "< CLP$5M",
    "5k_20k": "CLP$5M – CLP$19M",
    "20k_50k": "CLP$19M – CLP$50M",
    "50k_plus": "CLP$50M+",
  },
  askingPrice: {
    under_100k: "< CLP$100M",
    "100k_250k": "CLP$100M – CLP$250M",
    "250k_500k": "CLP$250M – CLP$500M",
    "500k_1m": "CLP$500M – CLP$1.000M",
    "1m_plus": "CLP$1.000M+",
  },
};

const ars: CurrencyRanges = {
  code: "ARS",
  symbol: "ARS$",
  revenue: {
    under_5k: "< ARS$5M",
    "5k_20k": "ARS$5M – ARS$25M",
    "20k_50k": "ARS$25M – ARS$60M",
    "50k_plus": "ARS$60M+",
  },
  askingPrice: {
    under_100k: "< ARS$120M",
    "100k_250k": "ARS$120M – ARS$300M",
    "250k_500k": "ARS$300M – ARS$600M",
    "500k_1m": "ARS$600M – ARS$1.200M",
    "1m_plus": "ARS$1.200M+",
  },
};

const pen: CurrencyRanges = {
  code: "PEN",
  symbol: "S/",
  revenue: {
    under_5k: "< S/19K",
    "5k_20k": "S/19K – S/75K",
    "20k_50k": "S/75K – S/185K",
    "50k_plus": "S/185K+",
  },
  askingPrice: {
    under_100k: "< S/375K",
    "100k_250k": "S/375K – S/940K",
    "250k_500k": "S/940K – S/1,9M",
    "500k_1m": "S/1,9M – S/3,7M",
    "1m_plus": "S/3,7M+",
  },
};

export const currencyByCountry: Record<string, CurrencyRanges> = {
  mexico: mxn,
  brazil: brl,
  colombia: cop,
  chile: clp,
  argentina: ars,
  peru: pen,
  other: usd,
};

export function getCurrencyForCountry(country: string): CurrencyRanges {
  return currencyByCountry[country] ?? usd;
}
