"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type LedgerRemoveButtonProps = {
  symbol: string;
  name: string;
};

export function LedgerRemoveButton({
  symbol,
  name
}: LedgerRemoveButtonProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const removeFromLedger = () => {
    setMessage("");
    setError("");

    startTransition(async () => {
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
          throw new Error(payload.error || "逐签出册未谐。");
        }

        setMessage(`${name} 已遣出金册。`);
        router.refresh();
      } catch (removeError) {
        setError(
          removeError instanceof Error
            ? removeError.message
            : "逐签出册未谐，姑俟后时再试。"
        );
      }
    });
  };

  return (
    <div className="mt-4 space-y-2">
      <button
        type="button"
        onClick={removeFromLedger}
        disabled={isPending}
        className="min-h-11 rounded-xl border border-tertiary/20 bg-tertiary/10 px-4 py-2 text-sm font-bold text-tertiary transition disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "逐签出册中…" : "遣出金册"}
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
