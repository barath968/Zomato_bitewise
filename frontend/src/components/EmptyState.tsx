type Props = {
  reason: string;
  suggestions: string[];
};

export function EmptyState({ reason, suggestions }: Props) {
  const tips =
    suggestions.length > 0
      ? suggestions
      : ["Widen cuisine", "Lower min rating", "Change budget"];

  return (
    <div className="rounded-2xl border border-bw-border bg-bw-surface px-6 py-10 text-center">
      <h2 className="font-display text-xl font-bold text-bw-text">
        No matches in this slice of Bangalore
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-bw-muted">{reason}</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {tips.map((tip) => (
          <span
            key={tip}
            className="rounded-full bg-bw-high px-3.5 py-1.5 font-display text-xs font-semibold text-bw-text"
          >
            {tip}
          </span>
        ))}
      </div>
    </div>
  );
}
