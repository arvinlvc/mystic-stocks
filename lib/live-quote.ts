export type RealtimeQuote = {
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  openPrice: number;
  highPrice: number;
  lowPrice: number;
  previousClose: number;
  amount: number;
  turnover: number;
  amplitude: number;
  fetchedAt: string;
};

type EastmoneyQuoteResponse = {
  data?: {
    f43?: number;
    f44?: number;
    f45?: number;
    f46?: number;
    f48?: number;
    f57?: string;
    f58?: string;
    f60?: number;
    f168?: number;
    f169?: number;
    f170?: number;
    f171?: number;
  };
};

type CachedQuote = {
  expiresAt: number;
  quote: RealtimeQuote | null;
};

const QUOTE_ENDPOINT = "https://push2.eastmoney.com/api/qt/stock/get";
const QUOTE_FIELDS = "f43,f44,f45,f46,f48,f57,f58,f60,f168,f169,f170,f171";
const FETCH_TIMEOUT_MS = 4500;
const CACHE_TTL_MS = 20 * 1000;

const cache = new Map<string, CachedQuote>();

function toSecid(symbol: string) {
  const normalized = symbol.trim();

  if (/^(600|601|603|605|688|689|900)/.test(normalized)) {
    return `1.${normalized}`;
  }

  return `0.${normalized}`;
}

function fromHundred(value?: number) {
  return typeof value === "number" ? value / 100 : 0;
}

function isQuoteUsable(payload?: EastmoneyQuoteResponse["data"]) {
  return Boolean(payload?.f57 && payload?.f58 && payload?.f43);
}

export async function getRealtimeQuote(symbol: string) {
  const normalized = symbol.trim();
  if (!normalized) {
    return null;
  }

  const cached = cache.get(normalized);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.quote;
  }

  try {
    const search = new URLSearchParams({
      secid: toSecid(normalized),
      fields: QUOTE_FIELDS
    });

    const response = await fetch(`${QUOTE_ENDPOINT}?${search.toString()}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
      headers: {
        Accept: "application/json,text/plain,*/*",
        Referer: "https://quote.eastmoney.com/"
      }
    });

    if (!response.ok) {
      throw new Error(`quote:${response.status}`);
    }

    const payload = (await response.json()) as EastmoneyQuoteResponse;
    if (!isQuoteUsable(payload.data)) {
      throw new Error("quote:empty");
    }

    const quote: RealtimeQuote = {
      symbol: payload.data!.f57!,
      name: payload.data!.f58!,
      currentPrice: fromHundred(payload.data!.f43),
      highPrice: fromHundred(payload.data!.f44),
      lowPrice: fromHundred(payload.data!.f45),
      openPrice: fromHundred(payload.data!.f46),
      amount: payload.data!.f48 || 0,
      previousClose: fromHundred(payload.data!.f60),
      turnover: fromHundred(payload.data!.f168),
      change: fromHundred(payload.data!.f169),
      changePercent: fromHundred(payload.data!.f170),
      amplitude: fromHundred(payload.data!.f171),
      fetchedAt: new Date().toISOString()
    };

    cache.set(normalized, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      quote
    });

    return quote;
  } catch {
    cache.set(normalized, {
      expiresAt: Date.now() + 5 * 1000,
      quote: null
    });

    return null;
  }
}
