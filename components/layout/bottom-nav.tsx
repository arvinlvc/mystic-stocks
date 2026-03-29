"use client";

import Link from "next/link";
import { BookOpenText, Compass, Sparkles, TrendingUp } from "lucide-react";

type BottomNavProps = {
  activePath: string;
};

const items = [
  { href: "/", label: "命盘", icon: Compass },
  { href: "/market", label: "司象", icon: TrendingUp },
  { href: "/divination", label: "卦坛", icon: Sparkles },
  { href: "/ledger", label: "金册", icon: BookOpenText }
];

export function BottomNav({ activePath }: BottomNavProps) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-primary/10 bg-surface/88 backdrop-blur-xl"
      aria-label="主导航"
    >
      <div className="mx-auto grid max-w-md grid-cols-4 gap-2 px-3 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        {items.map((item) => {
          const Icon = item.icon;
          const active = activePath === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-h-11 flex-col items-center justify-center rounded-2xl px-2 py-2 transition-all ${
                active
                  ? "bg-surface-highest/75 text-primary shadow-[inset_0_1px_0_rgba(242,202,80,0.18)]"
                  : "text-muted hover:bg-surface-high/60 hover:text-secondary"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="mt-1 font-label text-[10px] uppercase tracking-[0.2em]">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
