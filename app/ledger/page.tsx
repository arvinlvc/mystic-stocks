import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { ElementDonut } from "@/components/charts/element-donut";
import { LedgerRemoveButton } from "@/components/watchlist/ledger-remove-button";
import { getAppState } from "@/lib/app-state";
import {
  buildElementMix,
  buildLedgerSummary,
  getDominantElement
} from "@/lib/market-derive";

export const dynamic = "force-dynamic";

export default async function LedgerPage() {
  const state = await getAppState();
  const watchlist = state.watchlist;
  const totalAssets = buildLedgerSummary(watchlist);
  const elementMix = buildElementMix(watchlist);
  const dominantElement = getDominantElement(elementMix);
  const latestInsight =
    state.recommendations[0]?.output.riskWarning ||
    "须先赴卦坛迎一谶，而后方可奉心许之签入箓。";

  return (
    <AppShell
      activePath="/ledger"
      eyebrow="金箓秘藏"
      title="金册玄府"
      subtitle="将应签镌入金箓，使心证留痕。"
      orbGlyph={dominantElement.name}
    >
      <section className="pt-4 text-center">
        <p className="section-label text-primary/70">册中灵资</p>
        <h2 className="mt-3 font-display text-5xl font-black tracking-tight text-primary">
          {totalAssets.major}
          <span className="text-2xl opacity-75">.{totalAssets.minor}</span>
        </h2>
        <div className="mx-auto mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-secondary/20 bg-secondary/10 px-4 py-2 text-secondary">
          <span className="font-label text-xs uppercase tracking-[0.16em]">
            灵应腾炁
          </span>
          <span className="font-bold">{totalAssets.change}</span>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-5">
          <div>
            <h3 className="font-display text-xl text-ink">箓中五行</h3>
            <p className="mt-1 text-sm text-muted">诸签既入金箓，流炁由是成文。</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-[auto_1fr] items-center gap-6">
          <ElementDonut items={elementMix} />
          <div className="space-y-3">
            {elementMix.map((item) => (
              <div key={item.name} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.color }}
                    aria-hidden="true"
                  />
                  <span className="font-label text-xs uppercase tracking-[0.14em] text-ink">
                    {item.name}
                  </span>
                </div>
                <span className="text-sm font-bold text-ink">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between px-1">
          <h3 className="font-display text-2xl text-ink">神庭藏签</h3>
          <span className="section-label text-primary/90">
            {watchlist.length} 藏
          </span>
        </div>

        {watchlist.length === 0 ? (
          <div className="panel p-5">
            <p className="text-sm leading-7 text-muted">
              金册尚虚。待卦坛降下一谶后，便可将心许之签奉入玄府。
            </p>
            <Link
              href="/divination"
              className="gold-button mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 font-display text-base font-bold"
            >
              往迎首签
            </Link>
          </div>
        ) : (
          watchlist.map((position) => (
            <article key={position.symbol} className="panel p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-high text-lg font-display text-primary">
                    {position.name.slice(0, 1)}
                  </div>
                  <div>
                    <p className="text-base font-bold text-ink">{position.name}</p>
                    <p className="mt-1 font-label text-[10px] uppercase tracking-[0.18em] text-muted">
                      {position.symbol} · {position.sector}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-label text-[10px] uppercase tracking-[0.18em] text-muted">
                    灵应 {position.confidence}
                  </p>
                  <p className="mt-1 text-sm font-bold text-secondary">
                    {position.action}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(position.savedAt).toLocaleString("zh-CN")}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted">{position.thesis}</p>
              <LedgerRemoveButton
                symbol={position.symbol}
                name={position.name}
              />
            </article>
          ))
        )}
      </section>

      <section className="glass-panel relative overflow-hidden p-6">
        <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10">
          <p className="section-label text-primary/70">末后谕辞</p>
          <h3 className="mt-2 font-display text-xl text-primary">点睛谶语</h3>
          <p className="mt-4 text-sm leading-7 text-ink/90">{latestInsight}</p>
          <div className="mt-5 flex items-center justify-between border-t border-primary/10 pt-4">
            <span className="font-label text-[10px] uppercase tracking-[0.18em] text-muted">
              出自近谶
            </span>
            <Link
              href="/market"
              className="min-h-11 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2 font-label text-xs uppercase tracking-[0.18em] text-primary transition-colors hover:bg-primary/15"
            >
              往勘市象
            </Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
