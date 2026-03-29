import { randomUUID } from "node:crypto";

import { getBigModelConfig } from "@/lib/env";
import type {
  RecommendationRequest,
  RecommendationResponse,
  StockRecommendation
} from "@/lib/recommendation-types";

type RecommendationGenerationOptions = {
  realtimeContext?: string;
  dataFreshnessHint?: string;
};

type BigModelChoice = {
  message?: {
    content?: string;
  };
};

type BigModelResponse = {
  choices?: BigModelChoice[];
  error?: {
    code?: string;
    message?: string;
  };
};

type ParsedRecommendationShape = Partial<RecommendationResponse> & {
  answer?: Array<{
    code?: string;
    symbol?: string;
    name?: string;
    sector?: string;
    reason?: string;
    thesis?: string;
    catalysts?: unknown;
    risks?: unknown;
    action?: string;
    suitability?: string;
    confidence?: unknown;
  }>;
};

const RESPONSE_SCHEMA_HINT = JSON.stringify({
  summary: "一句话总判",
  marketView: "一句话市观",
  dataFreshness: "应如实说明已纳入何时的实时行情，若仅部分签池入榜也要说明",
  recommendations: [
    {
      rank: 1,
      name: "股票名称",
      symbol: "股票代码",
      sector: "赛道",
      thesis: "推荐缘由",
      catalysts: ["催化1", "催化2"],
      risks: ["风险1", "风险2"],
      action: "观察/分批布局/回调关注",
      suitability: "适合何种持签者",
      confidence: 78
    }
  ],
  watchlist: ["备选1", "备选2"],
  riskWarning: "一句话避煞提醒",
  disclaimer: "研究交流用途，不构成投资建议"
});

function compactInput(input: RecommendationRequest) {
  return [
    `风格:${input.investmentStyle}`,
    `周期:${input.investmentHorizon}`,
    `赛道:${input.preferredSectors}`,
    `签池:${input.stockPool}`,
    `心诀:${input.marketNotes}`
  ].join(" | ");
}

function buildPrimaryPrompt(
  input: RecommendationRequest,
  options: RecommendationGenerationOptions
) {
  return [
    "你是A股研究助手。",
    "只输出合法JSON对象。",
    "不要markdown，不要代码块，不要额外解释。",
    "不要编造未提供的实时价格、涨跌幅、资金流、公告时间。",
    "推荐仅限签池内股票，最多3只。",
    "confidence必须为0到100整数；catalysts和risks必须为字符串数组。",
    "若已提供实时行情摘录，marketView与dataFreshness必须据此作答，不得再写未接入实时行情。",
    options.dataFreshnessHint
      ? `dataFreshness请直接写成或贴近此意:${options.dataFreshnessHint}`
      : "若无实时行情摘录，须明说仅据签池与研究框架生成。",
    `字段结构:${RESPONSE_SCHEMA_HINT}`,
    `用户输入:${compactInput(input)}`,
    `实时行情摘录:${options.realtimeContext || "无"}`
  ].join("\n");
}

function buildFallbackPrompt(
  input: RecommendationRequest,
  options: RecommendationGenerationOptions
) {
  return [
    "你是A股研究助手，只返回JSON。",
    "从给定签池选最多3只A股。",
    "不得编造未提供的实时行情。",
    "若已给出实时行情摘录，须在marketView与dataFreshness中体现。",
    "输出字段: summary, marketView, dataFreshness, recommendations, watchlist, riskWarning, disclaimer。",
    "recommendations内字段: rank,name,symbol,sector,thesis,catalysts,risks,action,suitability,confidence。",
    options.dataFreshnessHint
      ? `dataFreshness参考:${options.dataFreshnessHint}`
      : "dataFreshness须坦言未纳入实时行情。",
    `输入:${compactInput(input)}`,
    `实时行情摘录:${options.realtimeContext || "无"}`
  ].join("\n");
}

function clampConfidence(value: unknown) {
  if (typeof value === "string") {
    if (value.includes("高")) {
      return 82;
    }
    if (value.includes("中")) {
      return 68;
    }
    if (value.includes("低")) {
      return 45;
    }
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(100, Math.max(0, Math.round(numeric)));
}

function normalizeStringList(value: unknown) {
  if (Array.isArray(value)) {
    return value.map((entry) => String(entry).trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(/[；;、,，/]/)
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeRecommendation(
  item: Partial<StockRecommendation>,
  index: number
): StockRecommendation {
  const rawItem = item as Record<string, unknown>;
  const normalizedConfidence = clampConfidence(item.confidence);

  return {
    rank: item.rank ?? index + 1,
    name: item.name?.trim() || `候选标的 ${index + 1}`,
    symbol: item.symbol?.trim() || "待补充",
    sector: item.sector?.trim() || "待分析",
    thesis: item.thesis?.trim() || "模型未返回明确逻辑，请补充上下文后重试。",
    catalysts: normalizeStringList(rawItem.catalysts),
    risks: normalizeStringList(rawItem.risks),
    action: item.action?.trim() || "先观察，不追高。",
    suitability: item.suitability?.trim() || "适合做研究观察的用户",
    confidence:
      item.confidence === undefined ||
      item.confidence === null ||
      normalizedConfidence === 0
        ? 72
        : normalizedConfidence
  };
}

function parseJsonContent(content: unknown) {
  if (typeof content !== "string") {
    throw new Error("模型返回内容为空。");
  }

  const cleaned = content
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleaned) as ParsedRecommendationShape;
}

function coerceRecommendations(parsed: ParsedRecommendationShape) {
  if (Array.isArray(parsed.recommendations)) {
    return parsed.recommendations
      .slice(0, 3)
      .map((item, index) => normalizeRecommendation(item, index));
  }

  if (Array.isArray(parsed.answer)) {
    return parsed.answer.slice(0, 3).map((item, index) =>
      normalizeRecommendation(
        {
          rank: index + 1,
          name: item.name,
          symbol: item.symbol || item.code,
          sector: item.sector || "待分析",
          thesis: item.thesis || item.reason,
          catalysts: normalizeStringList(item.catalysts),
          risks: normalizeStringList(item.risks),
          action: item.action || "观察",
          suitability: item.suitability || "适合愿作中线参研之人",
          confidence: clampConfidence(item.confidence ?? 72)
        },
        index
      )
    );
  }

  return [];
}

function normalizeResponse(
  parsed: ParsedRecommendationShape,
  options: RecommendationGenerationOptions
) {
  const recommendations = coerceRecommendations(parsed);

  return {
    summary: parsed.summary?.trim() || "模型已返回结果，但总判为空。",
    marketView:
      parsed.marketView?.trim() || "当前缺少更完整的市况线索，宜以结构轮动视之。",
    dataFreshness:
      parsed.dataFreshness?.trim() ||
      options.dataFreshnessHint ||
      "未接入实时行情，仅基于用户输入、给定签池与研究框架生成。",
    recommendations,
    watchlist: Array.isArray(parsed.watchlist)
      ? parsed.watchlist.map((item) => String(item))
      : [],
    riskWarning:
      parsed.riskWarning?.trim() ||
      "股海多变，须并看公告、估值与仓律，不可唯谶词而动。",
    disclaimer:
      parsed.disclaimer?.trim() || "本结果仅供研究交流，不构成任何投资建议。"
  } satisfies RecommendationResponse;
}

async function requestBigModel(prompt: string, timeoutMs: number) {
  const { apiKey, baseUrl, model } = getBigModelConfig();

  if (!apiKey) {
    throw new Error("缺少 BIGMODEL_API_KEY，无法调用大模型。");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        stream: false,
        do_sample: false,
        temperature: 0.1,
        max_tokens: 1024,
        response_format: {
          type: "json_object"
        },
        thinking: {
          type: "disabled"
        },
        user_id: "aureum_web_app",
        request_id: randomUUID(),
        messages: [
          {
            role: "system",
            content: prompt
          },
          {
            role: "user",
            content: "请立刻给出结果。"
          }
        ]
      }),
      signal: controller.signal,
      cache: "no-store"
    });

    const payload = (await response.json()) as BigModelResponse;

    if (!response.ok) {
      const errorCode = payload.error?.code || "";
      const errorMessage = payload.error?.message || JSON.stringify(payload);

      if (errorCode === "1113") {
        throw new Error(
          "BigModel 账号余额不足或没有可用资源包，当前无法调用所选模型。请先充值，或切换到当前账号可用的模型。"
        );
      }

      throw new Error(`BigModel 请求失败（${response.status}）：${errorMessage}`);
    }

    return payload;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("REQUEST_TIMEOUT");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function generateRecommendation(
  input: RecommendationRequest,
  options: RecommendationGenerationOptions = {}
): Promise<RecommendationResponse> {
  const attempts = [
    {
      prompt: buildPrimaryPrompt(input, options),
      timeoutMs: 22_000
    },
    {
      prompt: buildFallbackPrompt(input, options),
      timeoutMs: 28_000
    }
  ];

  let lastError: Error | null = null;

  for (const attempt of attempts) {
    try {
      const payload = await requestBigModel(attempt.prompt, attempt.timeoutMs);
      const parsed = parseJsonContent(payload.choices?.[0]?.message?.content);
      return normalizeResponse(parsed, options);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("账号余额不足")
      ) {
        throw error;
      }

      lastError =
        error instanceof Error ? error : new Error("调用模型失败，请稍后重试。");
    }
  }

  if (lastError?.message === "REQUEST_TIMEOUT") {
    throw new Error(
      "BigModel 请谶超时。已自动改用简式 prompt 重试，但坛前仍未回音，请稍后再试。"
    );
  }

  if (lastError instanceof SyntaxError) {
    throw new Error("BigModel 已返回内容，但 JSON 谶文不完整，已无法入册，请稍后重试。");
  }

  throw lastError || new Error("调用模型失败，请稍后重试。");
}
