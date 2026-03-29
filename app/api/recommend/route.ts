import { NextResponse } from "next/server";

import {
  appendRecommendationRecord,
  replaceWatchlistItems
} from "@/lib/app-state";
import { generateRecommendation } from "@/lib/bigmodel";
import { hasBigModelConfig } from "@/lib/env";
import {
  buildRealtimeMarketContext,
  getLiveMarketSnapshot
} from "@/lib/live-market";
import type {
  InvestmentHorizon,
  InvestmentStyle,
  RecommendationRequest
} from "@/lib/recommendation-types";

const styles = new Set<InvestmentStyle>(["稳健", "均衡", "进取"]);
const horizons = new Set<InvestmentHorizon>(["短线", "波段", "中期"]);

function validatePayload(payload: Partial<RecommendationRequest>) {
  if (!payload.investmentStyle || !styles.has(payload.investmentStyle)) {
    return "请先选定合宜的行盘路数。";
  }

  if (!payload.investmentHorizon || !horizons.has(payload.investmentHorizon)) {
    return "请先选定合宜的应期长短。";
  }

  if (!payload.stockPool?.trim()) {
    return "请至少提供一个股票池。";
  }

  if (payload.stockPool.length > 400) {
    return "股票池过长，请控制在 400 字以内。";
  }

  if ((payload.marketNotes || "").length > 1000) {
    return "心中所感过长，请控制在 1000 字以内。";
  }

  return null;
}

export async function POST(request: Request) {
  if (!hasBigModelConfig()) {
    return NextResponse.json(
      {
        error: "BigModel 环境变量未配置完整。"
      },
      { status: 500 }
    );
  }

  let body: Partial<RecommendationRequest>;

  try {
    body = (await request.json()) as Partial<RecommendationRequest>;
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON。" }, { status: 400 });
  }

  const validationError = validatePayload(body);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const investmentStyle = body.investmentStyle as InvestmentStyle;
  const investmentHorizon = body.investmentHorizon as InvestmentHorizon;
  const stockPool = body.stockPool?.trim();

  if (!stockPool) {
    return NextResponse.json({ error: "请至少提供一个股票池。" }, { status: 400 });
  }

  try {
    const preferredSectors = body.preferredSectors?.trim() || "未指定";
    const marketSnapshot = await getLiveMarketSnapshot();
    const marketContext = buildRealtimeMarketContext(marketSnapshot, stockPool);
    const input = {
      investmentStyle,
      investmentHorizon,
      preferredSectors,
      stockPool,
      marketNotes: [body.marketNotes?.trim(), marketContext.promptNote]
        .filter(Boolean)
        .join(" "),
    };

    const recommendation = await generateRecommendation(input, {
      realtimeContext: marketContext.promptNote,
      dataFreshnessHint: marketContext.freshnessNote
    });
    await appendRecommendationRecord(input, recommendation);
    await replaceWatchlistItems(recommendation.recommendations);

    return NextResponse.json(recommendation);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "调用模型失败，请稍后重试。"
      },
      { status: 500 }
    );
  }
}
