type SectionTitleProps = {
  title: string;
  kicker?: string;
};

export function SectionTitle({ title, kicker }: SectionTitleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h3 className="font-display text-xl text-ink">{title}</h3>
      {kicker ? <span className="section-label text-primary/70">{kicker}</span> : null}
    </div>
  );
}
