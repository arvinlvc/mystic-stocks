import type {
  InvestmentHorizon,
  InvestmentStyle,
  RecommendationRequest
} from "@/lib/recommendation-types";
import {
  buildMarketPoolForSectors,
  type LiveMarketSnapshot
} from "@/lib/live-market";

export type RitualLine = {
  index: number;
  total: 6 | 7 | 8 | 9;
  kind: "yin" | "yang";
  moving: boolean;
  label: string;
};

type TrigramMeta = {
  code: string;
  name: string;
  sector: string;
  stockPool: string[];
  note: string;
};

const trigramMap: Record<string, TrigramMeta> = {
  "111": {
    code: "乾",
    name: "乾为天",
    sector: "AI算力、高端制造、半导体",
    stockPool: ["中际旭创 300308", "工业富联 601138", "寒武纪 688256"],
    note: "乾卦阳气充沛，更适合聚焦高景气、高弹性的进攻型赛道。"
  },
  "110": {
    code: "兑",
    name: "兑为泽",
    sector: "红利、银行、消费",
    stockPool: ["招商银行 600036", "中国神华 601088", "贵州茅台 600519"],
    note: "兑卦偏悦，重视现金流和分红，更适合稳健配置。"
  },
  "101": {
    code: "离",
    name: "离为火",
    sector: "消费电子、传媒、医药",
    stockPool: ["立讯精密 002475", "恒瑞医药 600276", "分众传媒 002027"],
    note: "离卦重势能和辨识度，适合关注景气回暖与品牌龙头。"
  },
  "100": {
    code: "震",
    name: "震为雷",
    sector: "新能源、机器人、先进制造",
    stockPool: ["宁德时代 300750", "汇川技术 300124", "比亚迪 002594"],
    note: "震卦主动，适合寻找产业拐点和量价共振的弹性标的。"
  },
  "011": {
    code: "巽",
    name: "巽为风",
    sector: "出海制造、消费、新材料",
    stockPool: ["美的集团 000333", "公牛集团 603195", "恩捷股份 002812"],
    note: "巽卦重渗透与扩散，适合寻找出海链与产业扩张机会。"
  },
  "010": {
    code: "坎",
    name: "坎为水",
    sector: "通信、AI基础设施、军工",
    stockPool: ["中际旭创 300308", "中兴通讯 000063", "中国卫星 600118"],
    note: "坎卦多险，强调纪律与风控，适合做趋势确认后的跟随。"
  },
  "001": {
    code: "艮",
    name: "艮为山",
    sector: "资源、公用事业、基建",
    stockPool: ["中国海油 600938", "长江电力 600900", "中国建筑 601668"],
    note: "艮卦重止，适合偏防御与低波动配置。"
  },
  "000": {
    code: "坤",
    name: "坤为地",
    sector: "银行、保险、公用事业",
    stockPool: ["招商银行 600036", "中国平安 601318", "华能水电 600025"],
    note: "坤卦厚重，强调耐心、仓位管理和防御底仓。"
  }
};

function getLineLabel(total: number) {
  switch (total) {
    case 6:
      return "阴 (老阴)";
    case 7:
      return "阳 (少阳)";
    case 8:
      return "阴 (少阴)";
    case 9:
      return "阳 (老阳)";
    default:
      return "待定";
  }
}

export function generateRitualLine(index: number): RitualLine {
  const tosses = Array.from({ length: 3 }, () =>
    Math.random() > 0.5 ? 3 : 2
  );
  const total = tosses.reduce<number>((sum, value) => sum + value, 0) as
    | 6
    | 7
    | 8
    | 9;
  const kind = total === 6 || total === 8 ? "yin" : "yang";
  const moving = total === 6 || total === 9;

  return {
    index,
    total,
    kind,
    moving,
    label: getLineLabel(total)
  };
}

function trigramFromLines(lines: RitualLine[]) {
  const code = lines
    .map((line) => (line.kind === "yang" ? "1" : "0"))
    .join("");

  return trigramMap[code] || trigramMap["111"];
}

function deriveStyle(lines: RitualLine[]): InvestmentStyle {
  const yangCount = lines.filter((line) => line.kind === "yang").length;

  if (yangCount >= 5) {
    return "进取";
  }

  if (yangCount <= 2) {
    return "稳健";
  }

  return "均衡";
}

function deriveHorizon(lines: RitualLine[]): InvestmentHorizon {
  const movingCount = lines.filter((line) => line.moving).length;

  if (movingCount >= 3) {
    return "短线";
  }

  if (movingCount === 0) {
    return "中期";
  }

  return "波段";
}

export function buildDraftFromRitual(
  lines: RitualLine[],
  marketSnapshot: LiveMarketSnapshot | null = null
) {
  const lower = trigramFromLines(lines.slice(0, 3));
  const upper = trigramFromLines(lines.slice(3, 6));
  const investmentStyle = deriveStyle(lines);
  const investmentHorizon = deriveHorizon(lines);
  const movingCount = lines.filter((line) => line.moving).length;

  const combinedPool = Array.from(
    new Set([...upper.stockPool, ...lower.stockPool])
  ).slice(0, 6);

  const preferredSectors = Array.from(
    new Set([...upper.sector.split("、"), ...lower.sector.split("、")])
  ).join("、");

  const livePool = buildMarketPoolForSectors(
    marketSnapshot,
    preferredSectors,
    combinedPool
  );

  const ritualName = `${upper.code}${lower.code}`;
  const summary = `${upper.name}上承${lower.name}，本次摇卦更偏向${preferredSectors}方向。`;
  const statusText =
    movingCount > 0
      ? `本次出现 ${movingCount} 条动爻，适合更强调节奏与风险控制。`
      : "本次卦象较稳，可优先关注中期逻辑较清晰的核心标的。";

  const marketNotes = [
    upper.note,
    lower.note,
    `本次风格推导为${investmentStyle}，周期推导为${investmentHorizon}。`,
    marketSnapshot?.marketNotes || "股票池暂以预设龙头为先。",
    statusText
  ].join(" ");

  const draft: RecommendationRequest = {
    investmentStyle,
    investmentHorizon,
    preferredSectors,
    stockPool: livePool.join("、"),
    marketNotes
  };

  return {
    ritualName,
    summary,
    statusText,
    draft
  };
}
