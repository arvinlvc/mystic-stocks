import type { RecommendationRequest } from "@/lib/recommendation-types";

export const divinationCastEventName = "oracle:ritual-cast";
export const divinationRecommendationSettledEventName =
  "oracle:recommendation-settled";

export type RitualCastDetail = {
  draft: RecommendationRequest;
  meta: {
    name: string;
    summary: string;
    statusText: string;
  };
  emittedAt: number;
};

export type RecommendationSettledDetail = {
  ok: boolean;
  message: string;
  emittedAt: number;
};

export function dispatchRitualCast(detail: RitualCastDetail) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<RitualCastDetail>(divinationCastEventName, {
      detail
    })
  );
}

export function dispatchRecommendationSettled(
  detail: RecommendationSettledDetail
) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<RecommendationSettledDetail>(
      divinationRecommendationSettledEventName,
      {
        detail
      }
    )
  );
}
