import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import type {
  RecommendationRequest,
  RecommendationResponse,
  StockRecommendation
} from "@/lib/recommendation-types";

export type RecommendationRecord = {
  id: string;
  createdAt: string;
  input: RecommendationRequest;
  output: RecommendationResponse;
};

export type WatchlistItem = {
  symbol: string;
  name: string;
  sector: string;
  action: string;
  confidence: number;
  thesis: string;
  savedAt: string;
};

export type AppState = {
  recommendations: RecommendationRecord[];
  watchlist: WatchlistItem[];
};

const dataDir = path.join(process.cwd(), ".data");
const stateFile = path.join(dataDir, "app-state.json");

const emptyState: AppState = {
  recommendations: [],
  watchlist: []
};

async function ensureStorage() {
  await mkdir(dataDir, { recursive: true });
}

async function writeState(state: AppState) {
  await ensureStorage();
  await writeFile(stateFile, JSON.stringify(state, null, 2), "utf8");
}

export async function getAppState(): Promise<AppState> {
  await ensureStorage();

  try {
    const raw = await readFile(stateFile, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppState>;

    return {
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : [],
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : []
    };
  } catch {
    await writeState(emptyState);
    return emptyState;
  }
}

export async function appendRecommendationRecord(
  input: RecommendationRequest,
  output: RecommendationResponse
) {
  const state = await getAppState();

  const record: RecommendationRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    input,
    output
  };

  state.recommendations = [record, ...state.recommendations].slice(0, 20);
  await writeState(state);

  return record;
}

export async function saveWatchlistItem(stock: StockRecommendation) {
  const state = await getAppState();

  const nextItem: WatchlistItem = {
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    action: stock.action,
    confidence: stock.confidence,
    thesis: stock.thesis,
    savedAt: new Date().toISOString()
  };

  state.watchlist = [
    nextItem,
    ...state.watchlist.filter((item) => item.symbol !== stock.symbol)
  ].slice(0, 30);

  await writeState(state);
  return nextItem;
}

export async function replaceWatchlistItems(stocks: StockRecommendation[]) {
  const state = await getAppState();

  state.watchlist = stocks.slice(0, 3).map((stock) => ({
    symbol: stock.symbol,
    name: stock.name,
    sector: stock.sector,
    action: stock.action,
    confidence: stock.confidence,
    thesis: stock.thesis,
    savedAt: new Date().toISOString()
  }));

  await writeState(state);
  return state.watchlist;
}

export async function removeWatchlistItem(symbol: string) {
  const state = await getAppState();
  state.watchlist = state.watchlist.filter((item) => item.symbol !== symbol);
  await writeState(state);
  return state.watchlist;
}
