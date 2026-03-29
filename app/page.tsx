import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { FiveElementBars } from "@/components/charts/five-element-bars";
import { SectionTitle } from "@/components/ui/section-title";
import { getAppState } from "@/lib/app-state";
import {
  buildElementMix,
  computeQiIndex,
  getDominantElement,
  getCurrentCelestialTime
} from "@/lib/market-derive";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const state = await getAppState();
  const latestRecord = state.recommendations[0];
  const latestRecommendations = latestRecord?.output.recommendations || [];
  const celestialTime = getCurrentCelestialTime();
  const qiIndex = computeQiIndex(state.recommendations);
  const elementMix = buildElementMix(
    state.watchlist.length > 0 ? state.watchlist : latestRecommendations
  );
  const dominantElement = getDominantElement(elementMix);

  return (
    <AppShell
      activePath="/"
      eyebrow="太乙总览"
      title="乾坤命盘"
      subtitle="观斗柄回旋，候股海休咎。"
      orbGlyph={dominantElement.name}
    >
      <section className="panel relative overflow-hidden p-6">
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 text-center">
          <p className="section-label text-primary/80">今辰天时</p>
          <h2 className="mt-2 font-display text-4xl font-black text-primary">
            {celestialTime.label}
          </h2>
          <p className="mt-2 text-sm text-muted">
            今辰刻漏 · {celestialTime.range}
          </p>
          <div className="mt-6 flex h-12 items-end justify-center gap-1">
            {[4, 8, 12, 7, 4, 2].map((height, index) => (
              <div
                key={index}
                className={`w-1 rounded-full ${index === 2 ? "bg-primary" : "bg-primary/30"}`}
                style={{ height: `${height * 4}px` }}
              />
            ))}
          </div>
          <p className="mt-4 font-label text-[11px] uppercase tracking-[0.22em] text-outline">
            采自旧谶积气
          </p>
        </div>
      </section>

      <section className="panel p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-xl text-ink">九州市炁</h3>
            <p className="section-label mt-1 text-secondary">市局卦脉</p>
          </div>
          <div className="font-label text-4xl font-bold text-secondary">
            {qiIndex}
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-surface-highest">
          <div
            className="h-full rounded-full bg-gradient-to-r from-secondary/70 to-secondary shadow-jade"
            style={{ width: `${qiIndex}%` }}
          />
        </div>
        <div className="mt-3 flex justify-between font-label text-[10px] uppercase tracking-[0.18em] text-outline">
          <span>蛰伏</span>
          <span>转旺</span>
          <span>鼎盛</span>
        </div>
      </section>

      <section className="panel p-6">
        <SectionTitle title="五行流炁图" kicker="所藏命行" />
        <div className="mt-6">
          <FiveElementBars items={elementMix} />
        </div>
      </section>

      <section className="glass-panel relative overflow-hidden p-6">
        <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-primary/10 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl text-primary">近辰谶录</h3>
              <p className="mt-1 text-sm text-muted">
                {latestRecord
                  ? new Date(latestRecord.createdAt).toLocaleString("zh-CN")
                  : "谶府未启，今尚无辞"}
              </p>
            </div>
            <div className="rounded-full bg-primary/12 p-3 text-primary">
              <span className="font-label text-xs uppercase tracking-[0.2em]">
                {latestRecommendations.length || 0}
              </span>
            </div>
          </div>

          {latestRecord ? (
            <>
              <p className="mt-6 text-base leading-7 text-ink">
                {latestRecord.output.summary}
              </p>
              <blockquote className="mt-6 rounded-2xl bg-surface-low/80 p-4 text-sm italic leading-7 text-muted">
                {latestRecord.output.marketView}
              </blockquote>
              <div className="mt-5 flex flex-wrap gap-2">
                {latestRecommendations.map((item) => (
                  <span
                    key={item.symbol}
                    className="rounded-full border border-primary/14 bg-surface px-3 py-1.5 text-sm text-ink"
                  >
                    {item.name} {item.symbol}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-2xl bg-surface-low/80 p-5 text-sm leading-7 text-muted">
              须先赴卦坛焚符叩阙，命盘方显近辰断词与所应诸签。
            </div>
          )}

          <Link
            href="/divination"
            className="gold-button mt-6 inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-3 font-display text-base font-bold"
          >
            往诣卦坛
          </Link>
        </div>
      </section>
    </AppShell>
  );
}
