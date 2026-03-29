"use client";

import { useEffect, useRef, useState } from "react";

import {
  buildDraftFromRitual,
  generateRitualLine,
  type RitualLine
} from "@/lib/divination-ritual";
import {
  dispatchRitualCast
} from "@/lib/divination-events";
import type { LiveMarketSnapshot } from "@/lib/live-market";

type DivinationStudioProps = {
  modelReady: boolean;
  marketSnapshot: LiveMarketSnapshot | null;
};

type RitualPreset = ReturnType<typeof buildDraftFromRitual>;
type RitualProgressLine =
  | (RitualLine & { pending: false })
  | {
      index: number;
      total: null;
      kind: "yang";
      moving: false;
      pending: true;
      label: string;
    };

const emptyLines: RitualProgressLine[] = [6, 5, 4, 3, 2, 1].map((index) => ({
  index,
  total: null,
  kind: "yang" as const,
  moving: false,
  pending: true,
  label: ""
}));

const castStages = [
  "盥手敛神，候三钱入局，初气将开。",
  "初爻既落，地纹初震，内象始萌。",
  "二爻相承，阴阳互答，卦气渐明。",
  "三爻既续，内卦已具，神机微现。",
  "四五相随，外势将成，星枢徐转。",
  "上爻落定，河洛成文，卦门大启。"
] as const;

const castTypeIntervalMs = 92;
const castOpeningPauseMs = 260;
const castBetweenLinesMs = 180;
const castCloseDelayMs = 140;

function wait(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function DivinationStudio({
  modelReady,
  marketSnapshot
}: DivinationStudioProps) {
  const [lines, setLines] = useState<RitualProgressLine[]>(emptyLines);
  const [isCasting, setIsCasting] = useState(false);
  const [pulseCoins, setPulseCoins] = useState(false);
  const [ritualPreset, setRitualPreset] = useState<RitualPreset | null>(null);
  const [castWindowPhase, setCastWindowPhase] = useState<"closed" | "casting">(
    "closed"
  );
  const [castStage, setCastStage] = useState(0);
  const [castDisplayedText, setCastDisplayedText] = useState("");
  const castSequenceRef = useRef(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      castSequenceRef.current += 1;
    };
  }, []);

  useEffect(() => {
    if (castWindowPhase === "closed") {
      setCastDisplayedText("");
    }
  }, [castWindowPhase]);

  const revealCastText = async (text: string, sequence: number) => {
    if (!mountedRef.current || castSequenceRef.current !== sequence) {
      return false;
    }

    setCastDisplayedText("");

    for (let frame = 1; frame <= text.length; frame += 1) {
      if (!mountedRef.current || castSequenceRef.current !== sequence) {
        return false;
      }

      setCastDisplayedText(text.slice(0, frame));
      await wait(castTypeIntervalMs);
    }

    return mountedRef.current && castSequenceRef.current === sequence;
  };

  const castRitual = async () => {
    if (isCasting) {
      return;
    }

    const sequence = castSequenceRef.current + 1;
    castSequenceRef.current = sequence;

    setIsCasting(true);
    setCastWindowPhase("casting");
    setCastStage(0);
    setPulseCoins(true);
    setRitualPreset(null);
    setLines(emptyLines);
    setCastDisplayedText("");

    const generated: RitualLine[] = [];

    await wait(castOpeningPauseMs);

    for (let index = 1; index <= 6; index += 1) {
      if (!mountedRef.current || castSequenceRef.current !== sequence) {
        return;
      }

      const nextLine = generateRitualLine(index);
      generated.push(nextLine);

      setLines((current) =>
        current.map((line) =>
          line.index === index
            ? { ...nextLine, pending: false }
            : line
        )
      );
      setCastStage(index - 1);

      const textCompleted = await revealCastText(
        castStages[index - 1],
        sequence
      );

      if (!textCompleted) {
        return;
      }

      if (index < 6) {
        await wait(castBetweenLinesMs);
      }
    }

    setPulseCoins(false);

    const preset = buildDraftFromRitual(generated, marketSnapshot);
    setRitualPreset(preset);
    setIsCasting(false);

    dispatchRitualCast({
      draft: preset.draft,
      meta: {
        name: preset.ritualName,
        summary: preset.summary,
        statusText: preset.statusText
      },
      emittedAt: Date.now()
    });

    document
      .getElementById("ai-workbench")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });

    await wait(castCloseDelayMs);

    if (!mountedRef.current || castSequenceRef.current !== sequence) {
      return;
    }

    setCastWindowPhase("closed");
  };

  const currentStatus = ritualPreset
    ? ritualPreset.statusText
    : isCasting
      ? "坛炁微动，六爻循次而垂，少顷卦象自明。"
      : "微叩此钮，三钱回旋成象，六爻既具，卦门自引谶辞。";

  return (
    <>
      {castWindowPhase !== "closed" ? (
        <div
          className="cast-overlay"
          role="status"
          aria-live="polite"
        >
          <div className="cast-overlay__aura" aria-hidden="true" />
          <div className="cast-overlay__card">
            <div className="cast-overlay__glyphs" aria-hidden="true">
              <span>河</span>
              <span>洛</span>
              <span>卦</span>
            </div>
            <p className="section-label text-secondary/80">太玄卦盘运转中</p>
            <h3 className="mt-3 font-display text-3xl text-secondary">
              {castStage >= 5 ? "六爻既具，河洛成章" : "星盘布爻，河洛成象"}
            </h3>
            <div className="mt-5 cast-overlay__board" aria-hidden="true">
              <div className="cast-overlay__rings">
                <span />
                <span />
                <span />
              </div>
              <div className="cast-overlay__coins">
                {[0, 1, 2].map((index) => (
                  <span
                    key={index}
                    className={pulseCoins ? "animate-bounce" : ""}
                    style={
                      pulseCoins
                        ? { animationDelay: `${index * 120}ms` }
                        : undefined
                    }
                  >
                    爻
                  </span>
                ))}
              </div>
            </div>
            <p className="mt-5 min-h-[3.5rem] text-sm leading-7 text-ink/90">
              {castDisplayedText}
              <span className="ritual-overlay__cursor" aria-hidden="true">
                |
              </span>
            </p>
            <div className="mt-4 rounded-2xl border border-secondary/16 bg-secondary/8 p-4">
              <div className="space-y-2">
                {lines
                  .slice()
                  .reverse()
                  .map((line) => (
                    <div
                      key={line.index}
                      className={`flex items-center gap-3 text-xs ${
                        line.pending ? "opacity-45" : ""
                      }`}
                    >
                      <span className="w-6 font-label text-secondary/75">
                        {line.index}
                      </span>
                      {line.pending ? (
                        <div className="h-2 flex-1 rounded-full bg-surface-highest" />
                      ) : line.kind === "yin" ? (
                        <div className="flex flex-1 gap-1.5">
                          <div className="h-2 flex-1 rounded-full bg-secondary/80" />
                          <div className="h-2 flex-1 rounded-full bg-secondary/80" />
                        </div>
                      ) : (
                        <div className="h-2 flex-1 rounded-full bg-[#90b7ff]" />
                      )}
                      <span className="w-20 text-right text-muted">
                        {line.pending ? "未判" : line.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <p className="mt-5 text-xs leading-6 text-muted">
              此窗专司起卦定象。每爻既落，文句自徐徐显尽；六爻既备，法窗便即敛去。
            </p>
          </div>
        </div>
      ) : null}

      <section className="pt-2 text-center">
        <p className="font-display text-2xl font-bold tracking-wide text-primary/90">
          凝神掐诀，焚念起爻
        </p>

        <div className="relative mx-auto mt-10 flex h-52 items-center justify-center gap-4">
          {[0, 1, 2].map((index) => (
            <div
              key={index}
              className={`relative flex items-center justify-center rounded-full bg-gradient-to-br from-[#f2ca50] via-[#d4af37] to-[#8d711a] transition-transform duration-300 ${
                index === 1 ? "h-24 w-24 -translate-y-4 shadow-glow" : "h-20 w-20 shadow-[0_8px_32px_rgba(212,175,55,0.28)]"
              } ${pulseCoins ? "animate-bounce" : ""}`}
              style={pulseCoins ? { animationDelay: `${index * 110}ms` } : undefined}
              aria-hidden="true"
            >
              <div className="h-7 w-7 rotate-45 rounded-sm border-2 border-[#554300] bg-surface" />
              <div className="absolute inset-1 rounded-full border border-white/20" />
            </div>
          ))}
          <div className="absolute inset-x-8 top-10 -z-10 h-28 rounded-full bg-primary/10 blur-[80px]" />
        </div>

        <button
          type="button"
          onClick={castRitual}
          disabled={isCasting || !modelReady}
          className="gold-button flex min-h-11 w-full items-center justify-center rounded-2xl px-5 py-4 font-display text-lg font-bold transition-transform disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
          aria-label="即刻起卦"
        >
          {isCasting ? "六爻成象中…" : "即刻掷爻，启门演卦"}
        </button>

        {!modelReady ? (
          <p className="mt-3 text-xs leading-6 text-tertiary">
            灵钥未就，外坛未启，今辰未可自引真谶。
          </p>
        ) : null}
      </section>

      <section className="panel p-5">
        <div className="space-y-4">
          {lines
            .slice()
            .reverse()
            .map((line) => (
              <div
                key={line.index}
                className={`flex items-center gap-4 ${line.pending ? "opacity-35" : ""}`}
              >
                <span
                  className={`w-7 font-label text-xs ${
                    line.pending ? "text-muted" : "text-primary"
                  }`}
                >
                  {line.index.toString().padStart(2, "0")}
                </span>

                {line.pending ? (
                  <div className="h-3 flex-1 rounded-full bg-surface-highest" />
                ) : line.kind === "yin" ? (
                  <div className="flex flex-1 gap-2">
                    <div className="h-3 flex-1 rounded-full bg-secondary shadow-jade" />
                    <div className="h-3 flex-1 rounded-full bg-secondary shadow-jade" />
                  </div>
                ) : (
                  <div className="h-3 flex-1 rounded-full bg-primary shadow-glow" />
                )}

                <span
                  className={`w-24 text-right font-label text-xs ${
                    line.pending
                      ? "text-muted"
                      : line.kind === "yin"
                        ? "text-secondary"
                        : "text-primary"
                  }`}
                >
                  {line.pending ? "爻象未定" : line.label}
                </span>
              </div>
            ))}
        </div>
      </section>

      {marketSnapshot ? (
        <section className="panel p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label text-primary/75">今朝旺脉</p>
              <h3 className="mt-2 font-display text-xl text-ink">龙首签谱</h3>
            </div>
            <div className="rounded-full bg-primary/12 px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.18em] text-primary">
              顺时取象
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">
            {marketSnapshot.marketNotes}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {marketSnapshot.hotThemes.map((theme) => (
              <span
                key={theme}
                className="rounded-full border border-primary/14 bg-surface px-3 py-1.5 text-xs text-ink"
              >
                {theme}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3">
            {marketSnapshot.highlightedStocks.slice(0, 6).map((pick) => (
              <div
                key={pick.symbol}
                className="flex items-center justify-between rounded-2xl bg-surface-low/80 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-bold text-ink">
                    {pick.name} {pick.symbol}
                  </p>
                  <p className="mt-1 text-xs text-muted">{pick.sector}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-secondary">
                    {pick.changePercent.toFixed(2)}%
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    成交额 {(pick.amount / 1e8).toFixed(1)} 亿
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel relative overflow-hidden p-5">
        <div className="absolute right-3 top-3 text-primary/10">
          <span className="font-label text-[64px]">卦</span>
        </div>
        <div className="relative z-10 flex items-start gap-3">
          <div className="mt-1 h-8 w-8 rounded-full bg-primary/12 text-center font-display text-primary">
            气
          </div>
          <div>
            <h3 className="font-display text-lg text-ink">
              {ritualPreset ? `卦门既开 · ${ritualPreset.ritualName}` : "静候卦门大启"}
            </h3>
            <p className="mt-2 text-sm leading-7 text-muted">{currentStatus}</p>
            {ritualPreset ? (
              <p className="mt-3 text-sm leading-7 text-primary/90">
                {ritualPreset.summary}
              </p>
            ) : null}
          </div>
        </div>
      </section>

    </>
  );
}
