import type { KlineFrame, RealtimeKline } from "@/lib/live-kline";

type QiCandlesProps = {
  candles: RealtimeKline[];
  frame: KlineFrame;
  frameLabel: string;
};

const frameSensitivity = {
  day: {
    minSpreadRatio: 0.004,
    paddingRatio: 0.1,
    paddingFloorRatio: 0.0015,
    wickRatio: 0.24,
    wickFloorRatio: 0.0012,
    bodyWidth: 84,
    bodyMinHeight: 2.6,
    wickWidth: 1.5
  },
  "60m": {
    minSpreadRatio: 0.006,
    paddingRatio: 0.14,
    paddingFloorRatio: 0.0023,
    wickRatio: 0.4,
    wickFloorRatio: 0.002,
    bodyWidth: 80,
    bodyMinHeight: 2.2,
    wickWidth: 1.3
  },
  "30m": {
    minSpreadRatio: 0.008,
    paddingRatio: 0.18,
    paddingFloorRatio: 0.003,
    wickRatio: 0.58,
    wickFloorRatio: 0.0035,
    bodyWidth: 76,
    bodyMinHeight: 1.9,
    wickWidth: 1.1
  }
} as const;

function formatShortDate(date: string) {
  if (date.includes(" ")) {
    return date.slice(5, 16).replace("-", "/");
  }

  return date.slice(5).replace("-", "/");
}

function formatAxisPrice(value: number) {
  return value.toFixed(2);
}

export function QiCandles({ candles, frame, frameLabel }: QiCandlesProps) {
  if (candles.length === 0) {
    return (
      <div className="relative flex h-52 items-center justify-center rounded-2xl border border-primary/10 bg-surface-low/70 text-sm text-muted">
        今刻烛象未临，且俟少顷，更观市烛舒卷。
      </div>
    );
  }

  const highs = candles.map((item) => item.high);
  const lows = candles.map((item) => item.low);
  const bodyHighs = candles.map((item) => Math.max(item.open, item.close));
  const bodyLows = candles.map((item) => Math.min(item.open, item.close));
  const maxHigh = Math.max(...highs);
  const minLow = Math.min(...lows);
  const coreHigh = Math.max(...bodyHighs);
  const coreLow = Math.min(...bodyLows);
  const closeHigh = Math.max(...candles.map((item) => item.close));
  const closeLow = Math.min(...candles.map((item) => item.close));
  const averageClose =
    candles.reduce((sum, item) => sum + item.close, 0) / candles.length;
  const profile = frameSensitivity[frame];
  const closeSpread = Math.max(closeHigh - closeLow, 0);
  const coreSpread = Math.max(
    coreHigh - coreLow,
    closeSpread * 1.12,
    averageClose * profile.minSpreadRatio,
    0.01
  );
  const wickTop = Math.max(maxHigh - coreHigh, 0);
  const wickBottom = Math.max(coreLow - minLow, 0);
  const basePadding = Math.max(
    coreSpread * profile.paddingRatio,
    averageClose * profile.paddingFloorRatio,
    0.02
  );
  const wickAllowance =
    coreSpread * profile.wickRatio + averageClose * profile.wickFloorRatio;
  const viewHigh =
    coreHigh + basePadding + Math.min(wickTop, wickAllowance);
  const viewLow =
    coreLow - basePadding - Math.min(wickBottom, wickAllowance);
  const spread = Math.max(viewHigh - viewLow, 0.01);
  const latest = candles[candles.length - 1];
  const first = candles[0];

  const priceToPercent = (value: number) => {
    const normalized = ((value - viewLow) / spread) * 100;
    return Math.min(100, Math.max(0, normalized));
  };
  const axisMarks = [viewHigh, viewLow + spread / 2, viewLow];

  return (
    <div className="relative h-52 overflow-hidden rounded-2xl border border-primary/10 bg-[linear-gradient(180deg,rgba(242,202,80,0.08),rgba(9,16,24,0.12))] pb-7 pl-11 pr-3 pt-4">
      <div className="pointer-events-none absolute inset-0">
        {[20, 40, 60, 80].map((value) => (
          <div
            key={value}
            className="absolute left-10 right-0 border-t border-dashed border-primary/10"
            style={{ top: `${value}%` }}
          />
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-4 left-0 z-10 flex w-10 flex-col justify-between pl-2 text-[10px] text-muted">
        {axisMarks.map((mark) => (
          <span key={mark} className="font-label tracking-[0.08em]">
            {formatAxisPrice(mark)}
          </span>
        ))}
      </div>

      <div className="absolute right-3 top-3 rounded-full border border-primary/12 bg-surface/70 px-2.5 py-1 font-label text-[10px] uppercase tracking-[0.18em] text-primary/80">
        今刻{frameLabel}
      </div>

      <div className="relative flex h-full items-stretch gap-1">
        {candles.map((candle) => {
          const highTop = 100 - priceToPercent(candle.high);
          const lowTop = 100 - priceToPercent(candle.low);
          const openTop = 100 - priceToPercent(candle.open);
          const closeTop = 100 - priceToPercent(candle.close);
          const bodyTop = Math.min(openTop, closeTop);
          const bodyHeight = Math.max(Math.abs(closeTop - openTop), 1.6);
          const bullish = candle.close >= candle.open;

          return (
            <div key={candle.date} className="relative flex h-full flex-1 justify-center">
              <div
                className={`absolute left-1/2 -translate-x-1/2 ${
                  bullish ? "bg-secondary/85" : "bg-tertiary/80"
                }`}
                style={{
                  width: `${profile.wickWidth}px`,
                  top: `${highTop}%`,
                  height: `${Math.max(lowTop - highTop, 1)}%`
                }}
              />
              <div
                className={`absolute left-1/2 -translate-x-1/2 rounded-[4px] border ${
                  bullish
                    ? "border-secondary/80 bg-secondary/75 shadow-[0_0_12px_rgba(89,222,155,0.18)]"
                    : "border-tertiary/80 bg-tertiary/70 shadow-[0_0_12px_rgba(255,151,133,0.16)]"
                }`}
                style={{
                  width: `${profile.bodyWidth}%`,
                  top: `${bodyTop}%`,
                  height: `${Math.max(bodyHeight, profile.bodyMinHeight)}%`
                }}
                title={`${candle.date} 开${candle.open} 收${candle.close} 高${candle.high} 低${candle.low}`}
              />
            </div>
          );
        })}
      </div>

      <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between text-[10px] text-muted">
        <span>{formatShortDate(first.date)}</span>
        <span className="font-label uppercase tracking-[0.16em] text-primary/80">
          今烛 {latest.close.toFixed(2)}
        </span>
        <span>{formatShortDate(latest.date)}</span>
      </div>
    </div>
  );
}
