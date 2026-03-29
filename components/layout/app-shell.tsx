import type { ReactNode } from "react";

import { BottomNav } from "@/components/layout/bottom-nav";

type AppShellProps = {
  activePath: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  orbGlyph?: string;
  children: ReactNode;
};

export function AppShell({
  activePath,
  eyebrow,
  title,
  subtitle,
  orbGlyph = "金",
  children
}: AppShellProps) {
  return (
    <div className="app-frame min-h-dvh">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-primary/8 bg-surface/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-md items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="section-label text-primary/75">{eyebrow}</p>
            <h1 className="mt-1 font-display text-2xl font-black tracking-wide text-primary">
              {title}
            </h1>
            <p className="mt-1 text-xs text-muted">{subtitle}</p>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/16 bg-surface-high/90 font-display text-primary">
            {orbGlyph}
          </div>
        </div>
      </header>

      <main className="safe-bottom mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 pb-12 pt-28">
        {children}
      </main>

      <BottomNav activePath={activePath} />
    </div>
  );
}
