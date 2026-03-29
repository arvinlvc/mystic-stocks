type HexagramProps = {
  lines: Array<"yin" | "yang">;
};

export function Hexagram({ lines }: HexagramProps) {
  return (
    <div className="flex w-14 flex-col-reverse justify-between gap-2 py-1" aria-label="六爻卦象">
      {lines.map((line, index) =>
        line === "yang" ? (
          <div key={index} className="h-2 w-full rounded-full bg-primary" />
        ) : (
          <div key={index} className="flex gap-2">
            <div className="h-2 flex-1 rounded-full bg-primary" />
            <div className="h-2 flex-1 rounded-full bg-primary" />
          </div>
        )
      )}
    </div>
  );
}
