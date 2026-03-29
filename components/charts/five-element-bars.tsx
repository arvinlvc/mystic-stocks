type ElementBarItem = {
  name: string;
  value: number;
  color: string;
};

type FiveElementBarsProps = {
  items: ElementBarItem[];
  compact?: boolean;
};

export function FiveElementBars({
  items,
  compact = false
}: FiveElementBarsProps) {
  if (compact) {
    return (
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.name} className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-label uppercase tracking-[0.16em] text-muted">
                {item.name}
              </span>
              <span className="font-bold text-ink">{item.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-highest">
              <div
                className="h-full rounded-full"
                style={{ width: `${item.value}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid h-40 grid-cols-5 items-end gap-3">
      {items.map((item) => (
        <div key={item.name} className="flex h-full flex-col items-center justify-end gap-3">
          <div className="relative flex h-full w-full items-end rounded-t-2xl bg-surface-high/70">
            <div
              className="w-full rounded-t-2xl transition-transform duration-300"
              style={{ height: `${item.value}%`, backgroundColor: item.color }}
            />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 font-label text-[10px] text-muted">
              {item.value}%
            </span>
          </div>
          <span className="font-display text-sm" style={{ color: item.color }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}
