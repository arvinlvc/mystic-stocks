import { defaultSectors, defaultStockPool } from "@/lib/recommendation-defaults";

type RawQuote = {
  f2?: number;
  f3?: number;
  f6?: number;
  f8?: number;
  f12?: string;
  f14?: string;
  f100?: string;
};

type EastmoneyListResponse = {
  data?: {
    diff?: RawQuote[];
  };
};

export type LiveMarketPick = {
  symbol: string;
  name: string;
  sector: string;
  price: number;
  changePercent: number;
  amount: number;
  turnover: number;
  hotness: number;
};

export type LiveMarketSnapshot = {
  generatedAt: string;
  preferredSectors: string;
  stockPool: string;
  marketNotes: string;
  hotThemes: string[];
  highlightedStocks: LiveMarketPick[];
};

export type LiveMarketContext = {
  promptNote: string;
  freshnessNote: string;
};

type CachedSnapshot = {
  expiresAt: number;
  snapshot: LiveMarketSnapshot;
};

const MARKET_ENDPOINT = "https://push2.eastmoney.com/api/qt/clist/get";
const A_SHARE_SCOPE = "m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23";
const MARKET_FIELDS = "f2,f3,f6,f8,f12,f14,f100";
const CACHE_TTL_MS = 3 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6500;
const RANK_PAGE_SIZE = 48;

let cache: CachedSnapshot | null = null;

function isUsableQuote(quote: RawQuote) {
  const symbol = quote.f12?.trim();
  const name = quote.f14?.trim();

  return Boolean(
    symbol &&
      name &&
      !name.includes("ST") &&
      !name.includes("*ST") &&
      !name.includes("退") &&
      (quote.f2 || 0) > 0 &&
      (quote.f6 || 0) > 0
  );
}

function computeHotness(quote: RawQuote) {
  const changePercent = quote.f3 || 0;
  const turnover = quote.f8 || 0;
  const amount = quote.f6 || 0;

  return (
    Math.max(changePercent, 0) * 4 +
    Math.min(Math.max(turnover, 0), 35) * 1.8 +
    Math.max(Math.log10(amount + 1) - 8, 0) * 14
  );
}

function pickToLabel(pick: LiveMarketPick) {
  return `${pick.name} ${pick.symbol}`;
}

function splitTokens(value: string) {
  return value
    .split(/[、,，/]/)
    .map((token) => token.trim())
    .filter(Boolean);
}

function extractStockPoolEntries(stockPool: string) {
  return stockPool
    .split(/[、]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const symbolMatch = entry.match(/(\d{6})/);
      const symbol = symbolMatch?.[1] || "";
      const name = entry.replace(/\s*\d{6}\s*/g, "").trim();
      return { label: entry, symbol, name };
    });
}

function formatMarketTime(iso: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(new Date(iso));
}

function intersectsSector(source: string, sectorFilters: string[]) {
  if (sectorFilters.length === 0) {
    return false;
  }

  return sectorFilters.some(
    (sector) => source.includes(sector) || sector.includes(source)
  );
}

function buildFallbackSnapshot(): LiveMarketSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    preferredSectors: defaultSectors,
    stockPool: defaultStockPool,
    marketNotes:
      "今朝外盘讯脉未能尽取，姑以坛中旧藏龙头签池代天行令。待市声再通，自会换作当日热榜。",
    hotThemes: splitTokens(defaultSectors),
    highlightedStocks: []
  };
}

function toPick(quote: RawQuote): LiveMarketPick | null {
  if (!isUsableQuote(quote)) {
    return null;
  }

  return {
    symbol: quote.f12!.trim(),
    name: quote.f14!.trim(),
    sector: quote.f100?.trim() || "无门无类",
    price: quote.f2 || 0,
    changePercent: quote.f3 || 0,
    amount: quote.f6 || 0,
    turnover: quote.f8 || 0,
    hotness: computeHotness(quote)
  };
}

async function fetchRanking(fid: "f3" | "f6") {
  const search = new URLSearchParams({
    pn: "1",
    pz: String(RANK_PAGE_SIZE),
    po: "1",
    np: "1",
    fltt: "2",
    invt: "2",
    fid,
    fs: A_SHARE_SCOPE,
    fields: MARKET_FIELDS
  });

  const response = await fetch(`${MARKET_ENDPOINT}?${search.toString()}`, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    cache: "no-store",
    headers: {
      Accept: "application/json,text/plain,*/*",
      Referer: "https://quote.eastmoney.com/"
    }
  });

  if (!response.ok) {
    throw new Error(`行情榜单取回失败: ${response.status}`);
  }

  const payload = (await response.json()) as EastmoneyListResponse;
  return payload.data?.diff || [];
}

function mergeRankings(rankings: RawQuote[][]) {
  const merged = new Map<string, LiveMarketPick>();

  rankings.flat().forEach((quote) => {
    const pick = toPick(quote);
    if (!pick) {
      return;
    }

    const existing = merged.get(pick.symbol);
    if (!existing) {
      merged.set(pick.symbol, pick);
      return;
    }

    merged.set(pick.symbol, {
      ...existing,
      sector:
        existing.sector === "无门无类" && pick.sector !== "无门无类"
          ? pick.sector
          : existing.sector,
      price: Math.max(existing.price, pick.price),
      changePercent:
        Math.abs(pick.changePercent) > Math.abs(existing.changePercent)
          ? pick.changePercent
          : existing.changePercent,
      amount: Math.max(existing.amount, pick.amount),
      turnover: Math.max(existing.turnover, pick.turnover),
      hotness: Math.max(existing.hotness, pick.hotness)
    });
  });

  return Array.from(merged.values()).sort((left, right) => {
    if (right.hotness !== left.hotness) {
      return right.hotness - left.hotness;
    }

    if (right.amount !== left.amount) {
      return right.amount - left.amount;
    }

    return right.changePercent - left.changePercent;
  });
}

function deriveHotThemes(picks: LiveMarketPick[]) {
  const scores = new Map<string, number>();

  picks.forEach((pick, index) => {
    const sector = pick.sector.trim();
    if (!sector) {
      return;
    }

    const rankWeight = Math.max(14 - index, 3);
    const hotnessWeight = Math.max(Math.round(pick.hotness), 1);
    scores.set(sector, (scores.get(sector) || 0) + rankWeight + hotnessWeight);
  });

  return Array.from(scores.entries())
    .sort((left, right) => right[1] - left[1])
    .slice(0, 6)
    .map(([sector]) => sector);
}

function buildSnapshotFromPicks(picks: LiveMarketPick[]): LiveMarketSnapshot {
  if (picks.length === 0) {
    return buildFallbackSnapshot();
  }

  const highlightedStocks = picks.slice(0, 18);
  const hotThemes = deriveHotThemes(highlightedStocks);
  const preferredSectors = hotThemes.slice(0, 4).join("、") || defaultSectors;
  const stockPool =
    highlightedStocks.slice(0, 12).map(pickToLabel).join("、") || defaultStockPool;
  const leadNames = highlightedStocks
    .slice(0, 3)
    .map((pick) => pick.name)
    .join("、");

  return {
    generatedAt: new Date().toISOString(),
    preferredSectors,
    stockPool,
    marketNotes: `今朝市脉自全市热榜取象，眼下旺气偏向${preferredSectors}。诸般龙首之中，以${leadNames}最为炽盛，签池亦随盘中热度与成交声势即时轮转。`,
    hotThemes,
    highlightedStocks
  };
}

export function buildMarketPoolForSectors(
  snapshot: LiveMarketSnapshot | null,
  preferredSectors: string,
  fallbackPool: string[]
) {
  if (!snapshot) {
    return fallbackPool;
  }

  const sectorFilters = splitTokens(preferredSectors);
  const prioritized = snapshot.highlightedStocks.filter((pick) =>
    intersectsSector(pick.sector, sectorFilters)
  );

  const merged = new Map<string, string>();

  prioritized
    .concat(snapshot.highlightedStocks)
    .map(pickToLabel)
    .forEach((label) => {
      if (!merged.has(label)) {
        merged.set(label, label);
      }
    });

  fallbackPool.forEach((label) => {
    if (!merged.has(label)) {
      merged.set(label, label);
    }
  });

  return Array.from(merged.values()).slice(0, 12);
}

export function buildRealtimeMarketContext(
  snapshot: LiveMarketSnapshot | null,
  stockPool: string
): LiveMarketContext {
  if (!snapshot) {
    return {
      promptNote: "实时行情摘录暂缺，仍以签池与既有研究框架参断。",
      freshnessNote: "此谶未能并入当刻盘口，只可视作签池研判之辞。"
    };
  }

  const asOf = formatMarketTime(snapshot.generatedAt);
  const entries = extractStockPoolEntries(stockPool);
  const lookup = new Map(
    snapshot.highlightedStocks.map((pick) => [pick.symbol, pick])
  );
  const matched = entries
    .map((entry) => lookup.get(entry.symbol))
    .filter((pick): pick is LiveMarketPick => Boolean(pick))
    .slice(0, 6);
  const unmatched = entries
    .filter((entry) => entry.symbol && !lookup.has(entry.symbol))
    .slice(0, 4)
    .map((entry) => entry.name || entry.symbol);

  const matchedDigest =
    matched.length > 0
      ? matched
          .map(
            (pick) =>
              `${pick.name}${pick.symbol}属${pick.sector}，涨${pick.changePercent.toFixed(
                2
              )}% ，成交${(pick.amount / 1e8).toFixed(1)}亿，换手${pick.turnover.toFixed(
                2
              )}%`
          )
          .join("；")
      : "签池诸股暂未列入当下热榜前列";
  const unmatchedDigest =
    unmatched.length > 0
      ? `；其余如${unmatched.join("、")}暂未入前排热榜，仍须偏重中期逻辑与仓位节律`
      : "";

  return {
    promptNote: `实时行情摘录（${asOf}）: 今日热脉偏向${snapshot.hotThemes.join(
      "、"
    )}。签池映照如下：${matchedDigest}${unmatchedDigest}。`,
    freshnessNote: `已纳入${asOf}实时热榜、成交额与换手异动而成谶；入榜者兼看当刻热度，未入榜者仍以签池逻辑参断。`
  };
}

export async function getLiveMarketSnapshot() {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.snapshot;
  }

  try {
    const [gainers, turnoverLeaders] = await Promise.all([
      fetchRanking("f3"),
      fetchRanking("f6")
    ]);
    const snapshot = buildSnapshotFromPicks(
      mergeRankings([gainers, turnoverLeaders])
    );

    cache = {
      expiresAt: Date.now() + CACHE_TTL_MS,
      snapshot
    };

    return snapshot;
  } catch {
    const snapshot = buildFallbackSnapshot();
    cache = {
      expiresAt: Date.now() + 30 * 1000,
      snapshot
    };
    return snapshot;
  }
}
