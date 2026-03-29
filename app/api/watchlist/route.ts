import { NextResponse } from "next/server";

import { removeWatchlistItem, saveWatchlistItem } from "@/lib/app-state";
import type { StockRecommendation } from "@/lib/recommendation-types";

export async function POST(request: Request) {
  let stock: Partial<StockRecommendation>;

  try {
    stock = (await request.json()) as Partial<StockRecommendation>;
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

  if (!stock.symbol || !stock.name) {
    return NextResponse.json({ error: "缺少股票名称或代码。" }, { status: 400 });
  }

  const item = await saveWatchlistItem({
    rank: stock.rank ?? 0,
    name: stock.name,
    symbol: stock.symbol,
    sector: stock.sector || "待分析",
    thesis: stock.thesis || "",
    catalysts: Array.isArray(stock.catalysts) ? stock.catalysts : [],
    risks: Array.isArray(stock.risks) ? stock.risks : [],
    action: stock.action || "观察",
    suitability: stock.suitability || "",
    confidence: typeof stock.confidence === "number" ? stock.confidence : 0
  });

  return NextResponse.json(item);
}

export async function DELETE(request: Request) {
  let body: { symbol?: string };

  try {
    body = (await request.json()) as { symbol?: string };
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

  if (!body.symbol) {
    return NextResponse.json({ error: "缺少股票代码。" }, { status: 400 });
  }

  const watchlist = await removeWatchlistItem(body.symbol);
  return NextResponse.json({ watchlist });
}
