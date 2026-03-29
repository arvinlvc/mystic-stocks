type ElementDonutProps = {
  items: Array<{
    name: string;
    value: number;
    color: string;
  }>;
};

export function ElementDonut({ items }: ElementDonutProps) {
  const radius = 15.915;
  const circumference = 2 * Math.PI * radius;
  const dominant = items.reduce(
    (highest, current) => (current.value > highest.value ? current : highest),
    items[0] ?? { name: "金", value: 0, color: "rgb(242 202 80)" }
  );

  let offset = 0;

  return (
    <div className="relative h-40 w-40">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36" aria-hidden="true">
        {items.map((item) => {
          const dash = (item.value / 100) * circumference;
          const currentOffset = offset;
          offset += dash;

          return (
            <circle
              key={item.name}
              cx="18"
              cy="18"
              r={radius}
              fill="none"
              stroke={item.color}
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-currentOffset}
              strokeWidth="3.8"
            />
          );
        })}
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-xl font-bold text-primary">{dominant.name}</span>
        <span className="font-label text-[10px] uppercase tracking-[0.18em] text-muted">
          主炁
        </span>
      </div>
    </div>
  );
}
