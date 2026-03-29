export type RealtimeKline = {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  amount: number;
  turnover: number;
};

export type KlineFrame = "day" | "60m" | "30m";

type EastmoneyKlineResponse = {
  data?: {
    klines?: string[];
  };
};

type CachedKlines = {
  expiresAt: number;
  klines: RealtimeKline[];
};

const KLINE_ENDPOINT = "https://push2his.eastmoney.com/api/qt/stock/kline/get";
const KLINE_FIELDS_1 = "f1,f2,f3,f4,f5,f6";
const KLINE_FIELDS_2 = "f51,f52,f53,f54,f55,f56,f57,f58";
const FETCH_TIMEOUT_MS = 4500;
const CACHE_TTL_MS = 60 * 1000;

const cache = new Map<string, CachedKlines>();
const frameProfiles: Record<
  KlineFrame,
  {
    klt: string;
    defaultLimit: number;
    label: string;
  }
> = {
  day: {
    klt: "101",
    defaultLimit: 24,
    label: "日候"
  },
  "60m": {
    klt: "60",
    defaultLimit: 24,
    label: "时候"
  },
  "30m": {
    klt: "30",
    defaultLimit: 24,
    label: "刻候"
  }
};

function toSecid(symbol: string) {
  const normalized = symbol.trim();

  if (/^(600|601|603|605|688|689|900)/.test(normalized)) {
    return `1.${normalized}`;
  }

  return `0.${normalized}`;
}

function parseKline(entry: string) {
  const [date, open, close, high, low, , amount, turnover] = entry.split(",");

  if (!date || !open || !close || !high || !low) {
    return null;
  }

  return {
    date,
    open: Number(open),
    close: Number(close),
    high: Number(high),
    low: Number(low),
    amount: Number(amount || 0),
    turnover: Number(turnover || 0)
  } satisfies RealtimeKline;
}

export function normalizeKlineFrame(frame?: string | null): KlineFrame {
  if (frame === "60m" || frame === "30m") {
    return frame;
  }

  return "day";
}

export function getKlineFrameLabel(frame: KlineFrame) {
  return frameProfiles[frame].label;
}

export async function getRealtimeKlines(
  symbol: string,
  frame: KlineFrame = "day",
  limit?: number
) {
  const normalized = symbol.trim();
  if (!normalized) {
    return [];
  }

  const profile = frameProfiles[frame];
  const resolvedLimit = limit || profile.defaultLimit;
  const cacheKey = `${normalized}:${frame}:${resolvedLimit}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.klines;
  }

  try {
    const search = new URLSearchParams({
      secid: toSecid(normalized),
      fields1: KLINE_FIELDS_1,
      fields2: KLINE_FIELDS_2,
      klt: profile.klt,
      fqt: "1",
      beg: "20250101",
      end: "20500101",
      lmt: String(resolvedLimit)
    });

    const response = await fetch(`${KLINE_ENDPOINT}?${search.toString()}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      cache: "no-store",
      headers: {
        Accept: "application/json,text/plain,*/*",
        Referer: "https://quote.eastmoney.com/"
      }
    });

    if (!response.ok) {
      throw new Error(`kline:${response.status}`);
    }

    const payload = (await response.json()) as EastmoneyKlineResponse;
    const klines = (payload.data?.klines || [])
      .map(parseKline)
      .filter((item): item is RealtimeKline => Boolean(item));

    cache.set(cacheKey, {
      expiresAt: Date.now() + CACHE_TTL_MS,
      klines
    });

    return klines;
  } catch {
    cache.set(cacheKey, {
      expiresAt: Date.now() + 5 * 1000,
      klines: []
    });

    return [];
  }
}
