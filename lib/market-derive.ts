import type { RecommendationRecord, WatchlistItem } from "@/lib/app-state";
import type { ElementValue } from "@/lib/types";

const elementPalette = {
  metal: "rgb(242 202 80)",
  wood: "rgb(89 222 155)",
  fire: "rgb(255 151 133)",
  water: "rgb(109 171 255)",
  earth: "rgb(194 158 67)"
};

function inferElementFromSector(sector: string) {
  const normalized = sector.toLowerCase();

  if (normalized.includes("银行") || normalized.includes("金融") || normalized.includes("红利")) {
    return "metal";
  }

  if (normalized.includes("新能源") || normalized.includes("机器人") || normalized.includes("制造")) {
    return "wood";
  }

  if (normalized.includes("消费") || normalized.includes("医药") || normalized.includes("白酒")) {
    return "fire";
  }

  if (normalized.includes("算力") || normalized.includes("ai") || normalized.includes("半导体")) {
    return "water";
  }

  return "earth";
}

export function getCurrentCelestialTime(date = new Date()) {
  const hour = date.getHours();

  const slots = [
    { start: 23, end: 1, label: "子时", enLabel: "Zi Hour", range: "23:00 - 01:00" },
    { start: 1, end: 3, label: "丑时", enLabel: "Chou Hour", range: "01:00 - 03:00" },
    { start: 3, end: 5, label: "寅时", enLabel: "Yin Hour", range: "03:00 - 05:00" },
    { start: 5, end: 7, label: "卯时", enLabel: "Mao Hour", range: "05:00 - 07:00" },
    { start: 7, end: 9, label: "辰时", enLabel: "Chen Hour", range: "07:00 - 09:00" },
    { start: 9, end: 11, label: "巳时", enLabel: "Si Hour", range: "09:00 - 11:00" },
    { start: 11, end: 13, label: "午时", enLabel: "Wu Hour", range: "11:00 - 13:00" },
    { start: 13, end: 15, label: "未时", enLabel: "Wei Hour", range: "13:00 - 15:00" },
    { start: 15, end: 17, label: "申时", enLabel: "Shen Hour", range: "15:00 - 17:00" },
    { start: 17, end: 19, label: "酉时", enLabel: "You Hour", range: "17:00 - 19:00" },
    { start: 19, end: 21, label: "戌时", enLabel: "Xu Hour", range: "19:00 - 21:00" },
    { start: 21, end: 23, label: "亥时", enLabel: "Hai Hour", range: "21:00 - 23:00" }
  ];

  return (
    slots.find((slot) =>
      slot.start > slot.end
        ? hour >= slot.start || hour < slot.end
        : hour >= slot.start && hour < slot.end
    ) || slots[0]
  );
}

export function buildElementMix(
  items: Array<{ sector: string }>
): ElementValue[] {
  const counts = {
    metal: 0,
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0
  };

  items.forEach((item) => {
    const element = inferElementFromSector(item.sector);
    counts[element] += 1;
  });

  const total = Math.max(items.length, 1);

  return [
    { name: "金", value: Math.round((counts.metal / total) * 100), color: elementPalette.metal },
    { name: "木", value: Math.round((counts.wood / total) * 100), color: elementPalette.wood },
    { name: "水", value: Math.round((counts.water / total) * 100), color: elementPalette.water },
    { name: "火", value: Math.round((counts.fire / total) * 100), color: elementPalette.fire },
    { name: "土", value: Math.round((counts.earth / total) * 100), color: elementPalette.earth }
  ];
}

export function getDominantElement(items: ElementValue[]) {
  return items.reduce<ElementValue>(
    (highest, current) => (current.value > highest.value ? current : highest),
    items[0] ?? { name: "金", value: 0, color: elementPalette.metal }
  );
}

export function buildQiBars(confidence: number) {
  const base = Math.max(35, Math.min(92, confidence));
  return [0.56, 0.68, 0.82, 0.48, 0.63, 1, 0.78, 0.61].map((ratio, index) => ({
    value: Math.round(base * ratio),
    tone: index === 3 ? ("bear" as const) : ("bull" as const),
    marker: index === 2 ? "启" : index === 5 ? "旺" : undefined
  }));
}

export function buildHexagramFromSymbol(symbol: string) {
  const digits = symbol.replace(/\D/g, "").padEnd(6, "0").slice(0, 6);

  return digits.split("").map((digit) =>
    Number(digit) % 2 === 0 ? ("yin" as const) : ("yang" as const)
  );
}

export function computeQiIndex(records: RecommendationRecord[]) {
  const latest = records.slice(0, 3).flatMap((record) => record.output.recommendations);
  if (latest.length === 0) {
    return 0;
  }

  const total = latest.reduce((sum, item) => sum + item.confidence, 0);
  return Math.round(total / latest.length);
}

export function buildLedgerSummary(watchlist: WatchlistItem[]) {
  const total = watchlist.reduce((sum, item) => sum + item.confidence, 0) * 1380;
  const major = Math.floor(total).toLocaleString("zh-CN");
  const minor = String((watchlist.length * 17) % 100).padStart(2, "0");
  const change = watchlist.length
    ? `+${Math.max(3.2, (watchlist.reduce((sum, item) => sum + item.confidence, 0) / watchlist.length / 10)).toFixed(1)}%`
    : "0.0%";

  return { major, minor, change };
}
