"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { StockRecommendation } from "@/lib/recommendation-types";

type MarketWatchlistToggleProps = {
  stock: StockRecommendation;
  initiallySaved: boolean;
};

export function MarketWatchlistToggle({
  stock,
  initiallySaved
}: MarketWatchlistToggleProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(initiallySaved);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setSaved(initiallySaved);
  }, [initiallySaved]);

  const toggleWatchlist = () => {
    setError("");
    setMessage("");

    startTransition(async () => {
      try {
        const response = await fetch("/api/watchlist", {
          method: saved ? "DELETE" : "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(saved ? { symbol: stock.symbol } : stock)
        });

        const payload = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(payload.error || "金册改箓未谐。");
        }

        const nextSaved = !saved;
        setSaved(nextSaved);
        setMessage(
          nextSaved
            ? `${stock.name} 已奉入金册。`
            : `${stock.name} 已遣出金册。`
        );
        router.refresh();
      } catch (watchlistError) {
        setError(
          watchlistError instanceof Error
            ? watchlistError.message
            : "金册改箓未谐，姑俟后时再试。"
        );
      }
    });
  };

  return (
    <div className="mt-6 space-y-3">
      <button
        type="button"
        onClick={toggleWatchlist}
        disabled={isPending}
        className={`min-h-11 rounded-2xl px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          saved
            ? "border border-tertiary/20 bg-tertiary/10 text-tertiary"
            : "border border-primary/20 bg-primary/10 text-primary"
        }`}
      >
        {isPending ? "金册改箓中…" : saved ? "遣出金册" : "奉入金册"}
      </button>

      {message ? (
        <p className="text-sm leading-6 text-secondary">{message}</p>
      ) : null}

      {error ? (
        <p className="text-sm leading-6 text-tertiary">{error}</p>
      ) : null}
    </div>
  );
}
