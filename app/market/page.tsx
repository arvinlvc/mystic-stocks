import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { FiveElementBars } from "@/components/charts/five-element-bars";
import { QiCandles } from "@/components/charts/qi-candles";
import { Hexagram } from "@/components/divination/hexagram";
import { MarketWatchlistToggle } from "@/components/watchlist/market-watchlist-toggle";
import { getAppState } from "@/lib/app-state";
import {
  getKlineFrameLabel,
  getRealtimeKlines,
  normalizeKlineFrame,
  type KlineFrame
} from "@/lib/live-kline";
import { getRealtimeQuote } from "@/lib/live-quote";
import {
  buildElementMix,
  buildHexagramFromSymbol,
  getDominantElement
} from "@/lib/market-derive";

export const dynamic = "force-dynamic";

type MarketPageProps = {
  searchParams?: Promise<{
    frame?: string | string[];
  }>;
};

const frameOptions: Array<{ value: KlineFrame; label: string; chant: string }> = [
  { value: "day", label: "日候", chant: "观日烛" },
  { value: "60m", label: "时候", chant: "观时烛" },
  { value: "30m", label: "刻候", chant: "观刻烛" }
];

function formatPrice(value: number) {
  return value.toFixed(2);
}

function formatPercent(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

function formatSignedPrice(value: number) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatAmountYi(value: number) {
  return `${(value / 1e8).toFixed(1)}亿`;
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

export default async function MarketPage({ searchParams }: MarketPageProps) {
  const resolvedSearchParams = (await searchParams) || {};
  const frameParam = Array.isArray(resolvedSearchParams.frame)
    ? resolvedSearchParams.frame[0]
    : resolvedSearchParams.frame;
  const selectedFrame = normalizeKlineFrame(frameParam);
  const state = await getAppState();
  const latest = state.recommendations[0]?.output.recommendations[0];
  const isSaved = latest
    ? state.watchlist.some((item) => item.symbol === latest.symbol)
    : false;

  if (!latest) {
    return (
        <AppShell
          activePath="/market"
          eyebrow="象数勘市"
          title="市道司象"
          subtitle="须先迎一谶，方可审一股荣悴。"
        orbGlyph="土"
      >
        <section className="panel p-6">
          <h2 className="font-display text-2xl text-primary">坛中尚无主签</h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            市道司象所显，乃近辰一谶之主签，载其灵应、卦旨、煞伏与持签戒条。
          </p>
          <Link
            href="/divination"
            className="gold-button mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 font-display text-base font-bold"
          >
            先赴卦坛
          </Link>
        </section>
      </AppShell>
    );
  }

  const quote = await getRealtimeQuote(latest.symbol);
  const klineCandles = await getRealtimeKlines(latest.symbol, selectedFrame);
  const hexagram = buildHexagramFromSymbol(latest.symbol);
  const elements = buildElementMix([latest]);
  const dominantElement = getDominantElement(elements);
  const frameLabel = getKlineFrameLabel(selectedFrame);
  const quoteTone =
    quote && quote.changePercent >= 0 ? "text-secondary" : "text-tertiary";
  const quoteNote = quote
    ? `已纳${formatMarketTime(quote.fetchedAt)}盘声入卷，现价、升沉、崇卑与成交诸数，皆循当刻而陈。`
    : "今刻盘声未即来会，姑存谶辞与卦旨于此，俟后再补市价。";

  return (
    <AppShell
      activePath="/market"
      eyebrow="象数勘市"
      title={latest.name}
      subtitle={`${latest.symbol} · 近谶所指首签`}
      orbGlyph={dominantElement.name}
    >
      <section className="flex items-end justify-between gap-4">
        <div>
          <p className="section-label">盘声现势</p>
          <div className="mt-2 flex items-end gap-3">
            <span className={`text-5xl font-extrabold ${quote ? quoteTone : "text-secondary"}`}>
              {quote ? formatPrice(quote.currentPrice) : latest.confidence}
            </span>
            {quote ? (
              <span className={`pb-1 font-label text-sm ${quoteTone}`}>
                {formatPercent(quote.changePercent)}
              </span>
            ) : (
              <span className="pb-1 font-label text-sm text-secondary">
                / 100
              </span>
            )}
          </div>
          <p className="mt-3 text-xs text-muted">
            {quoteNote}
          </p>
        </div>

        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-primary/20 bg-primary/5">
          <div className="bagua-ring animate-[spin_20s_linear_infinite]" />
          <div className="text-center">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary/80">
              {quote ? "升沉" : "灵应"}
            </p>
            <p className={`font-display text-3xl font-black ${quote ? quoteTone : "text-primary"}`}>
              {quote ? formatSignedPrice(quote.change) : latest.confidence}
            </p>
          </div>
        </div>
      </section>

      {quote ? (
        <section className="grid grid-cols-2 gap-4">
          <div className="panel p-4">
            <p className="section-label">开盘启数</p>
            <p className="mt-3 text-2xl font-bold text-ink">
              {formatPrice(quote.openPrice)}
            </p>
            <p className="mt-1 text-xs text-muted">昨收 {formatPrice(quote.previousClose)}</p>
          </div>
          <div className="panel p-4">
            <p className="section-label">日中振度</p>
            <p className="mt-3 text-2xl font-bold text-ink">
              {formatPercent(quote.amplitude)}
            </p>
            <p className="mt-1 text-xs text-muted">易手 {formatPercent(quote.turnover)}</p>
          </div>
          <div className="panel p-4">
            <p className="section-label">上探之位</p>
            <p className="mt-3 text-2xl font-bold text-secondary">
              {formatPrice(quote.highPrice)}
            </p>
            <p className="mt-1 text-xs text-muted">下试 {formatPrice(quote.lowPrice)}</p>
          </div>
          <div className="panel p-4">
            <p className="section-label">成交灵潮</p>
            <p className="mt-3 text-2xl font-bold text-ink">
              {formatAmountYi(quote.amount)}
            </p>
              <p className="mt-1 text-xs text-muted">据东财近刻盘声而录</p>
          </div>
        </section>
      ) : null}

      <section className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg text-primary">卦潮起伏</h3>
          <div className="flex gap-3 font-label text-[10px] uppercase tracking-[0.18em] text-muted">
            <span className="text-primary">启阖</span>
            <span>崇卑</span>
            <span>时烛</span>
          </div>
        </div>
        <div className="mb-4 flex flex-wrap gap-2">
          {frameOptions.map((option) => {
            const active = option.value === selectedFrame;
            const href =
              option.value === "day"
                ? "/market"
                : `/market?frame=${option.value}`;

            return (
              <Link
                key={option.value}
                href={href}
                className={`rounded-full border px-3 py-2 font-label text-[11px] transition ${
                  active
                    ? "border-primary/30 bg-primary/12 text-primary shadow-[0_0_18px_rgba(212,175,55,0.14)]"
                    : "border-primary/10 bg-surface/65 text-muted"
                }`}
              >
                {option.chant} · {option.label}
              </Link>
            );
          })}
        </div>
        <QiCandles
          candles={klineCandles}
          frame={selectedFrame}
          frameLabel={frameLabel}
        />
      </section>

      <section className="grid grid-cols-[1.4fr_1fr] gap-4">
        <div className="glass-panel p-5">
          <h3 className="font-display text-lg text-primary">
            六爻断卦 · {latest.sector}
          </h3>
          <div className="mt-5 flex gap-4">
            <Hexagram lines={hexagram} />
            <div className="space-y-4 text-sm leading-6">
              <div>
                <p className="font-display text-sm text-primary">卦中真意</p>
                <p className="mt-1 text-muted">{latest.thesis}</p>
              </div>
              <div>
                <p className="font-display text-sm text-primary">相宜命主</p>
                <p className="mt-1 text-muted">{latest.suitability}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-panel p-5">
          <h3 className="font-display text-base text-primary">五行归脉</h3>
          <div className="mt-4">
            <FiveElementBars compact items={elements} />
          </div>
        </div>
      </section>

      <section className="panel relative overflow-hidden p-6">
        <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10">
          <p className="section-label text-primary/80">天机谶判</p>
          <blockquote className="mt-3 font-display text-2xl font-bold leading-relaxed text-ink">
            {latest.action}
          </blockquote>
          <p className="mt-4 text-sm leading-7 text-muted">{latest.thesis}</p>
          <MarketWatchlistToggle stock={latest} initiallySaved={isSaved} />
          <Link
            href="/ledger"
            className="gold-button mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl px-5 py-4 font-display text-lg font-bold"
          >
            往观金册
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4">
        <div className="panel p-4">
          <p className="section-label">煞机所伏</p>
          <div className="mt-3 space-y-2">
            {latest.risks.map((risk) => (
              <p key={risk} className="text-sm text-ink">
                {risk}
              </p>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <p className="section-label">应候机缘</p>
          <div className="mt-3 space-y-2">
            {latest.catalysts.map((catalyst) => (
              <p key={catalyst} className="text-sm text-ink">
                {catalyst}
              </p>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
