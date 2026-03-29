"use client";

import { useEffect, useState, useTransition } from "react";

import type { RecommendationRecord, WatchlistItem } from "@/lib/app-state";
import {
  dispatchRecommendationSettled,
  divinationCastEventName,
  type RitualCastDetail
} from "@/lib/divination-events";
import { defaultSectors, defaultStockPool } from "@/lib/recommendation-defaults";
import type { LiveMarketSnapshot } from "@/lib/live-market";
import type {
  InvestmentHorizon,
  InvestmentStyle,
  RecommendationRequest,
  RecommendationResponse,
  StockRecommendation
} from "@/lib/recommendation-types";

const styleOptions: InvestmentStyle[] = ["稳健", "均衡", "进取"];
const horizonOptions: InvestmentHorizon[] = ["短线", "波段", "中期"];
const styleLabels: Record<InvestmentStyle, string> = {
  稳健: "守玄持正",
  均衡: "调元执中",
  进取: "乘阳趋势"
};
const horizonLabels: Record<InvestmentHorizon, string> = {
  短线: "旬内问机",
  波段: "月轮候势",
  中期: "季候观变"
};
const minimumRitualDisplayMs = 2600;
const ritualStages = [
  "焚沉檀，启金炉，先请坛前清气。",
  "列签池，布星位，候龙头诸象归坛。",
  "叩天机，问升沉，借外坛灵机演卦成文。",
  "裁三签，定主次，将最应之股纳入金册。"
] as const;

type RecommendationWorkbenchProps = {
  modelReady: boolean;
  marketSnapshot?: LiveMarketSnapshot | null;
  initialHistory?: RecommendationRecord[];
  initialWatchlist?: WatchlistItem[];
  initialResult?: RecommendationResponse | null;
};

type StatePayload = {
  recommendations: RecommendationRecord[];
  watchlist: WatchlistItem[];
};

export function RecommendationWorkbench({
  modelReady,
  marketSnapshot = null,
  initialHistory = [],
  initialWatchlist = [],
  initialResult = null
}: RecommendationWorkbenchProps) {
  const [form, setForm] = useState<RecommendationRequest>({
    investmentStyle: "均衡",
    investmentHorizon: "波段",
    preferredSectors: marketSnapshot?.preferredSectors || defaultSectors,
    stockPool: marketSnapshot?.stockPool || defaultStockPool,
    marketNotes:
      marketSnapshot?.marketNotes ||
      "所观者，惟景炁升降、催机早晚与盈亏轻重；高位暴逐，非吾所取。"
  });
  const [result, setResult] = useState<RecommendationResponse | null>(
    initialResult
  );
  const [history, setHistory] = useState<RecommendationRecord[]>(initialHistory);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(initialWatchlist);
  const [ritualMeta, setRitualMeta] = useState<{
    name: string;
    summary: string;
    statusText: string;
  } | null>(null);
  const [analysisStage, setAnalysisStage] = useState(0);
  const [displayedStageText, setDisplayedStageText] = useState("");
  const [invokePhase, setInvokePhase] = useState<"closed" | "confirm" | "running">(
    "closed"
  );
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isSaving, startSaving] = useTransition();

  useEffect(() => {
    void loadState();
  }, []);

  useEffect(() => {
    if (!marketSnapshot) {
      return;
    }

    setForm((current) => ({
      ...current,
      preferredSectors: marketSnapshot.preferredSectors || current.preferredSectors,
      stockPool: marketSnapshot.stockPool || current.stockPool,
      marketNotes: marketSnapshot.marketNotes || current.marketNotes
    }));
  }, [marketSnapshot]);

  useEffect(() => {
    const handleRitualCast = (event: Event) => {
      const detail = (event as CustomEvent<RitualCastDetail>).detail;
      if (!detail) {
        return;
      }

      setRitualMeta(detail.meta);
      setForm(detail.draft);
      void submitRecommendation(detail.draft, {
        suppressOverlay: true,
        emitSettledEvent: true
      });
    };

    window.addEventListener(divinationCastEventName, handleRitualCast);
    return () => {
      window.removeEventListener(divinationCastEventName, handleRitualCast);
    };
  }, []);

  useEffect(() => {
    if (invokePhase !== "running") {
      return;
    }

    const timer = window.setInterval(() => {
      setAnalysisStage((current) => (current + 1) % ritualStages.length);
    }, 1600);

    return () => {
      window.clearInterval(timer);
    };
  }, [invokePhase]);

  useEffect(() => {
    if (invokePhase !== "running") {
      setDisplayedStageText("");
      return;
    }

    const currentLine = ritualStages[analysisStage];
    let frame = 0;

    setDisplayedStageText("");

    const timer = window.setInterval(() => {
      frame += 1;
      setDisplayedStageText(currentLine.slice(0, frame));

      if (frame >= currentLine.length) {
        window.clearInterval(timer);
      }
    }, 85);

    return () => {
      window.clearInterval(timer);
    };
  }, [analysisStage, invokePhase]);

  async function loadState() {
    try {
      const response = await fetch("/api/state", { cache: "no-store" });
      const payload = (await response.json()) as StatePayload & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "卦录未得启观。");
      }

      setHistory(payload.recommendations || []);
      setWatchlist(payload.watchlist || []);
    } catch (stateError) {
      setError(
        stateError instanceof Error
          ? stateError.message
          : "卦录未得启观，姑俟后时再叩。"
      );
    }
  }

  const watchlistSymbols = new Set(watchlist.map((item) => item.symbol));

  const updateField = <K extends keyof RecommendationRequest>(
    key: K,
    value: RecommendationRequest[K]
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submitRecommendation = async (
    request: RecommendationRequest,
    options?: {
      phaseAlreadyRunning?: boolean;
      suppressOverlay?: boolean;
      emitSettledEvent?: boolean;
    }
  ) => {
    if (!request.stockPool.trim()) {
      setError("签池未陈，天机无由命笔。");
      return;
    }

    setError("");
    setActionMessage("");
    setResult(null);
    setAnalysisStage(0);
    if (!options?.phaseAlreadyRunning && !options?.suppressOverlay) {
      setInvokePhase("running");
    }
    const ritualStartedAt = Date.now();

    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(request)
      });

      const payload = (await response.json()) as RecommendationResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error || "叩坛未谐，天机暂未垂示。");
      }

      setResult(payload);
      await loadState();
      if (payload.recommendations.length > 0) {
        setActionMessage("主卦三签既定，俱已收入金册。");
      }
      if (options?.emitSettledEvent) {
        dispatchRecommendationSettled({
          ok: true,
          message: payload.summary || "谶文已成。",
          emittedAt: Date.now()
        });
      }
    } catch (requestError) {
      const errorMessage =
        requestError instanceof Error
          ? requestError.message
          : "法坛一时寂寂，姑俟少顷再叩。";
      setError(
        errorMessage
      );
      if (options?.emitSettledEvent) {
        dispatchRecommendationSettled({
          ok: false,
          message: errorMessage,
          emittedAt: Date.now()
        });
      }
    } finally {
      if (options?.suppressOverlay) {
        return;
      }

      const elapsed = Date.now() - ritualStartedAt;
      const remaining = Math.max(minimumRitualDisplayMs - elapsed, 0);
      window.setTimeout(() => {
        setInvokePhase("closed");
      }, remaining + 680);
    }
  };

  const handleSubmit = () => {
    setInvokePhase("confirm");
  };

  const confirmSubmit = () => {
    setRitualMeta(null);
    setInvokePhase("running");
    startTransition(async () => {
      await submitRecommendation(form, { phaseAlreadyRunning: true });
    });
  };

  const saveToWatchlist = (stock: StockRecommendation) => {
    setActionMessage("");

    startSaving(async () => {
      try {
        const response = await fetch("/api/watchlist", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(stock)
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "金册未纳此签。");
        }

        setActionMessage(`${stock.name} 已奉入金册。`);
        await loadState();
      } catch (saveError) {
        setError(
          saveError instanceof Error ? saveError.message : "金册未纳此签。"
        );
      }
    });
  };

  const removeFromWatchlist = (symbol: string) => {
    setActionMessage("");

    startSaving(async () => {
      try {
        const response = await fetch("/api/watchlist", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ symbol })
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "此签未能出册。");
        }

        setActionMessage(`${symbol} 已逐出金册。`);
        await loadState();
      } catch (removeError) {
        setError(
          removeError instanceof Error ? removeError.message : "此签未能出册。"
        );
      }
    });
  };

  const restoreHistoryRecord = (record: RecommendationRecord) => {
    setForm(record.input);
    setResult(record.output);
    setError("");
    setActionMessage("旧卦既返坛前，可据此重参。");
    document
      .getElementById("ai-workbench")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div id="ai-workbench" className="space-y-6 scroll-mt-28">
      {invokePhase !== "closed" ? (
        <div
          className={`ritual-overlay ${
            invokePhase === "confirm"
              ? "ritual-overlay--edict"
              : "ritual-overlay--oracle"
          }`}
          role={invokePhase === "confirm" ? "dialog" : "status"}
          aria-modal={invokePhase === "confirm" ? "true" : undefined}
          aria-live={invokePhase === "running" ? "polite" : undefined}
        >
          <div className="ritual-overlay__halo" aria-hidden="true" />
          <div className="ritual-overlay__card">
            <div className="ritual-overlay__sigils" aria-hidden="true">
              {invokePhase === "confirm" ? (
                <>
                  <span>敕</span>
                  <span>谶</span>
                  <span>启</span>
                </>
              ) : (
                <>
                  <span>乾</span>
                  <span>坤</span>
                  <span>震</span>
                </>
              )}
            </div>
            {invokePhase === "confirm" ? (
              <>
                <p className="section-label text-primary/80">焚符启坛之前</p>
                <h3 className="mt-3 font-display text-3xl text-primary">
                  可愿叩阙请谶
                </h3>
                <p className="mt-4 text-sm leading-7 text-ink/90">
                  一焚灵符，诸象俱动；一启金坛，签命自陈。此番若叩天机，法坛将依你所列签池，
                  借外坛灵机演成股谶，并择其最应三签收入金册。
                </p>
                <div className="mt-4 rounded-2xl border border-primary/12 bg-primary/8 p-4 text-sm leading-7 text-muted">
                  今当默念所问，敛神屏气，不可轻心试戏。若心念已定，便可焚符请谶；若意未决，宜暂收法念，稍后再启。
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setInvokePhase("closed")}
                    className="min-h-11 rounded-2xl border border-primary/16 bg-surface-low/80 px-4 py-3 text-sm font-bold text-muted transition hover:border-primary/24 hover:text-ink"
                  >
                    暂敛心神
                  </button>
                  <button
                    type="button"
                    onClick={confirmSubmit}
                    className="gold-button min-h-11 rounded-2xl px-4 py-3 text-sm font-bold"
                  >
                    焚符叩阙
                  </button>
                </div>
                <p className="mt-4 text-xs leading-6 text-muted">
                  既启此坛，便以今番心诀与签池为凭，推演所应之股谶。
                </p>
              </>
            ) : (
              <>
                <p className="section-label text-primary/80">太乙法坛行令中</p>
                <h3 className="mt-3 font-display text-3xl text-primary">
                  紫微垂象，股签将成
                </h3>
                <div className="mt-5 ritual-overlay__altar" aria-hidden="true">
                  <div className="ritual-overlay__seal">敕</div>
                  <div className="ritual-overlay__talisman">
                    <span>天</span>
                    <span>机</span>
                    <span>断</span>
                    <span>股</span>
                  </div>
                  <div className="ritual-overlay__embers">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
                <p className="mt-5 min-h-[3.5rem] text-sm leading-7 text-ink/90">
                  {displayedStageText}
                  <span className="ritual-overlay__cursor" aria-hidden="true">
                    |
                  </span>
                </p>
                <div className="mt-4 rounded-2xl border border-primary/12 bg-primary/8 p-4 text-sm leading-7 text-muted">
                  金炉既炽，箓火正明；命盘所录诸签，皆已循次投坛。此坛既开，纵谶文先成，亦当稍候法印收束，方可闭阙藏锋。
                </div>
                <div className="mt-6 ritual-overlay__rings" aria-hidden="true">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
                  {ritualStages.map((_, index) => (
                    <span
                      key={index}
                      className={`h-2.5 rounded-full transition-all ${
                        analysisStage === index
                          ? "w-8 bg-primary shadow-glow"
                          : "w-2.5 bg-primary/25"
                      }`}
                    />
                  ))}
                </div>
                <p className="mt-5 text-xs leading-6 text-muted">
                  焚符已起，阙门已开。待股谶、法印、火箓三者俱毕，此窗自会敛去。
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}

      <section className="panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="section-label text-primary/75">紫微股谶</p>
            <h3 className="mt-2 font-display text-2xl text-ink">金阙断股坛</h3>
          </div>
          <div
            className={`rounded-full px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.18em] ${
              modelReady
                ? "bg-secondary/15 text-secondary"
                : "bg-tertiary/15 text-tertiary"
            }`}
          >
            {modelReady ? "法坛通灵" : "法坛沉寂"}
          </div>
        </div>

        <p className="mt-4 text-sm leading-7 text-muted">
          此间乃问市请谶之所。焚符之后，法坛将叩外坛灵机，迎回成文股谶，仍勒入卦府旧藏。
        </p>

        {marketSnapshot ? (
          <div className="mt-5 rounded-2xl border border-secondary/18 bg-secondary/10 p-4">
            <p className="section-label text-secondary/85">今辰龙头签谱</p>
            <p className="mt-2 text-sm leading-7 text-ink/90">
              今辰先取{marketSnapshot.hotThemes.join("、")}诸脉龙首入签池，待卦既成，法坛自会启请外坛灵机，并将最应三签录入金册。
            </p>
          </div>
        ) : null}

        {ritualMeta ? (
          <div className="mt-5 rounded-2xl border border-primary/18 bg-primary/10 p-4">
            <p className="section-label text-primary/80">今番卦名</p>
            <p className="mt-2 font-display text-xl text-primary">
              {ritualMeta.name}
            </p>
            <p className="mt-2 text-sm leading-7 text-ink/90">
              {ritualMeta.summary}
            </p>
            <p className="mt-2 text-sm leading-7 text-muted">
              {ritualMeta.statusText}
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="section-label">命式签令</span>
              <select
                className="oracle-select min-h-11 w-full rounded-2xl border border-primary/14 bg-surface-low px-4 text-sm text-ink outline-none transition focus:border-primary/35"
                value={form.investmentStyle}
                onChange={(event) =>
                  updateField(
                    "investmentStyle",
                    event.target.value as InvestmentStyle
                  )
                }
              >
                {styleOptions.map((option) => (
                  <option key={option} value={option}>
                    {styleLabels[option]}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="section-label">应期签令</span>
              <select
                className="oracle-select min-h-11 w-full rounded-2xl border border-primary/14 bg-surface-low px-4 text-sm text-ink outline-none transition focus:border-primary/35"
                value={form.investmentHorizon}
                onChange={(event) =>
                  updateField(
                    "investmentHorizon",
                    event.target.value as InvestmentHorizon
                  )
                }
              >
                {horizonOptions.map((option) => (
                  <option key={option} value={option}>
                    {horizonLabels[option]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="space-y-2">
            <span className="section-label">所叩脉门</span>
            <input
              className="min-h-11 w-full rounded-2xl border border-primary/10 bg-surface-low px-4 text-sm text-ink outline-none transition placeholder:text-muted/60 focus:border-primary/35"
              value={form.preferredSectors}
              onChange={(event) =>
                updateField("preferredSectors", event.target.value)
              }
              placeholder="可书红利、算力、白酒、机巧诸脉"
              
            />
          </label>

          <label className="space-y-2">
            <span className="section-label">签池名录</span>
            <textarea
              className="min-h-[120px] w-full rounded-2xl border border-primary/10 bg-surface-low px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-muted/60 focus:border-primary/35"
              value={form.stockPool}
              onChange={(event) => updateField("stockPool", event.target.value)}
              placeholder="具录所叩股名与券码，顿号、逗号、分行，皆可成列"
            />
          </label>

          <label className="space-y-2">
            <span className="section-label">所奉心诀</span>
            <textarea
              className="min-h-[140px] w-full rounded-2xl border border-primary/10 bg-surface-low px-4 py-3 text-sm leading-7 text-ink outline-none transition placeholder:text-muted/60 focus:border-primary/35"
              value={form.marketNotes}
              onChange={(event) =>
                updateField("marketNotes", event.target.value)
              }
              placeholder="具陈所见市脉寒暖、催机迟速、仓律所尚与所忌诸端"
            />
          </label>
        </div>

        {!modelReady ? (
          <div className="mt-5 rounded-2xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
            灵钥未备，外坛仍闭，今辰尚难启请真谶。宜检灵钥秘箓是否齐备。
          </div>
        ) : null}

        {error ? (
          <div className="mt-5 rounded-2xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-sm text-tertiary">
            {error}
          </div>
        ) : null}

        {actionMessage ? (
          <div className="mt-5 rounded-2xl border border-secondary/20 bg-secondary/10 px-4 py-3 text-sm text-secondary">
            {actionMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !modelReady || !form.stockPool.trim()}
          className="gold-button mt-6 min-h-11 w-full rounded-2xl px-5 py-4 font-display text-lg font-bold transition disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
        >
          {isPending ? "法坛演谶中…" : "焚符启坛，叩问股谶"}
        </button>

        <p className="mt-3 text-xs leading-6 text-muted">
          谶文但可参机，不可奉作铁券。此坛虽先纳当日热榜与盘中异动，终仍须兼参告示、估值与仓律。
        </p>
      </section>

      <section className="glass-panel p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="section-label text-primary/75">谶象垂文</p>
            <h3 className="mt-2 font-display text-2xl text-primary">金谶降坛</h3>
          </div>
          {result ? (
            <div className="rounded-full bg-primary/12 px-3 py-1.5 font-label text-[10px] uppercase tracking-[0.18em] text-primary">
              灵签 {result.recommendations.length}
            </div>
          ) : null}
        </div>

        {!result ? (
          <div className="mt-5 rounded-2xl bg-surface-low/80 p-5 text-sm leading-7 text-muted">
            一谶未降，此间姑虚。及其辞落，首签、旁签与断词，自当并陈于前。
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            <div className="rounded-2xl bg-surface-low/85 p-5">
              <p className="section-label">总断</p>
              <p className="mt-3 text-base leading-7 text-ink">{result.summary}</p>
              <p className="mt-4 text-sm leading-7 text-muted">
                {result.marketView}
              </p>
            </div>

            <div className="rounded-2xl border border-primary/10 bg-primary/6 p-4 text-sm leading-7 text-muted">
              <span className="font-bold text-primary">时运小识：</span>{" "}
              {result.dataFreshness}
            </div>

            <div className="space-y-4">
              {result.recommendations.map((item) => {
                const saved = watchlistSymbols.has(item.symbol);

                return (
                <article
                  key={`${item.symbol}-${item.rank}`}
                  className="panel p-5"
                >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="section-label text-primary/75">
                          第 {item.rank} 签
                        </p>
                        <h4 className="mt-2 font-display text-2xl text-ink">
                          {item.name}
                        </h4>
                        <p className="mt-1 font-label text-[11px] uppercase tracking-[0.2em] text-muted">
                          {item.symbol} · {item.sector}
                        </p>
                      </div>
                      <div className="rounded-full bg-secondary/12 px-3 py-1.5 font-label text-xs text-secondary">
                        灵应 {item.confidence}
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-ink/90">
                      {item.thesis}
                    </p>

                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                      <div>
                        <p className="section-label text-secondary/85">应候机缘</p>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
                          {item.catalysts.map((catalyst) => (
                            <li key={catalyst}>• {catalyst}</li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <p className="section-label text-tertiary/85">煞气所伏</p>
                        <ul className="mt-3 space-y-2 text-sm leading-7 text-muted">
                          {item.risks.map((risk) => (
                            <li key={risk}>• {risk}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl bg-surface-low/80 p-4">
                      <p className="text-sm leading-7 text-ink">
                        <span className="font-bold text-primary">持签戒条：</span>{" "}
                        {item.action}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted">
                        <span className="font-bold text-primary">相宜命主：</span>{" "}
                        {item.suitability}
                      </p>
                    </div>

                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() =>
                          saved
                            ? removeFromWatchlist(item.symbol)
                            : saveToWatchlist(item)
                        }
                        className={`min-h-11 rounded-xl px-4 py-2 text-sm font-bold transition ${
                          saved
                            ? "border border-tertiary/20 bg-tertiary/10 text-tertiary"
                            : "border border-primary/20 bg-primary/10 text-primary"
                        }`}
                      >
                        {saved ? "逐出金册" : "奉入金册"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {result.watchlist.length > 0 ? (
              <div className="rounded-2xl bg-surface-low/85 p-5">
                <p className="section-label">旁签副录</p>
                
                <div className="mt-4 flex flex-wrap gap-2">
                  {result.watchlist.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-primary/14 bg-surface px-3 py-1.5 text-sm text-ink"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="rounded-2xl border border-tertiary/20 bg-tertiary/10 p-4 text-sm leading-7 text-ink">
              <span className="font-bold text-tertiary">避煞告戒：</span>{" "}
              {result.riskWarning}
            </div>

            <div className="text-xs leading-6 text-muted">
              {result.disclaimer}
            </div>
          </div>
        )}
      </section>

      <section className="panel p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="section-label text-primary/75">旧谶秘录</p>
            <h3 className="mt-2 font-display text-2xl text-ink">谶府故藏</h3>
          </div>
          <div className="font-label text-xs uppercase tracking-[0.18em] text-muted">
            {history.length} 卦
          </div>
        </div>

        {history.length === 0 ? (
          <p className="mt-5 text-sm leading-7 text-muted">
            旧藏尚虚。待首度叩坛得谶之后，此间便会永录卦辞与所应诸签。
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {history.slice(0, 5).map((record) => (
              <article key={record.id} className="rounded-2xl bg-surface-low/80 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-bold text-ink">
                      {record.output.summary}
                    </p>
                    <p className="mt-2 text-xs text-muted">
                      {new Date(record.createdAt).toLocaleString("zh-CN")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="font-label text-[10px] uppercase tracking-[0.18em] text-primary">
                      {record.output.recommendations.length} 道
                    </div>
                    <button
                      type="button"
                      onClick={() => restoreHistoryRecord(record)}
                      className="rounded-xl border border-primary/16 bg-primary/10 px-3 py-2 text-xs font-bold text-primary"
                    >
                      返坛重参
                    </button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {record.output.recommendations.map((item) => (
                    <span
                      key={`${record.id}-${item.symbol}`}
                      className="rounded-full border border-primary/14 bg-surface px-3 py-1.5 text-xs text-ink"
                    >
                      {item.name} {item.symbol}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
