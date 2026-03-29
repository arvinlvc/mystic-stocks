import { DivinationStudio } from "@/components/divination/divination-studio";
import { RecommendationWorkbench } from "@/components/divination/recommendation-workbench";
import { AppShell } from "@/components/layout/app-shell";
import { getAppState } from "@/lib/app-state";
import { hasBigModelConfig } from "@/lib/env";
import { getLiveMarketSnapshot } from "@/lib/live-market";
import { buildElementMix, getDominantElement } from "@/lib/market-derive";

export const dynamic = "force-dynamic";

export default async function DivinationPage() {
  const modelReady = hasBigModelConfig();
  const marketSnapshot = await getLiveMarketSnapshot();
  const appState = await getAppState();
  const elementMix = buildElementMix(
    appState.watchlist.length > 0
      ? appState.watchlist
      : appState.recommendations[0]?.output.recommendations ?? []
  );
  const dominantElement = getDominantElement(elementMix);

  return (
    <AppShell
      activePath="/divination"
      eyebrow="六爻请谶"
      title="卦坛"
      subtitle="焚香叩阙，借一炉玄火烛照股海升沉。"
      orbGlyph={dominantElement.name}
    >
      <DivinationStudio
        modelReady={modelReady}
        marketSnapshot={marketSnapshot}
      />
      <RecommendationWorkbench
        modelReady={modelReady}
        marketSnapshot={marketSnapshot}
        initialHistory={appState.recommendations.slice(0, 5)}
        initialWatchlist={appState.watchlist}
        initialResult={appState.recommendations[0]?.output ?? null}
      />
    </AppShell>
  );
}
