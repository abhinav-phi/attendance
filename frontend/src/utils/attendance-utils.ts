export const getPercentageColor = (
  pct: number,
): "success" | "warning" | "danger" | "default" => {
  if (isNaN(pct)) return "default";
  if (pct >= 75) return "success";
  if (pct >= 50) return "warning";

  return "danger";
};

export const calculateClassesNeeded = (
  present: number,
  total: number,
): { type: "need" | "skip" | "perfect"; count: number; percentage: number } => {
  const currentPct = total > 0 ? (present / total) * 100 : 0;

  if (currentPct >= 75) {
    const canSkip = Math.floor((present - 0.75 * total) / 0.75);

    return {
      type: "skip",
      count: Math.max(0, canSkip),
      percentage: currentPct,
    };
  } else {
    const needed = Math.ceil(3 * total - 4 * present);

    return { type: "need", count: Math.max(0, needed), percentage: currentPct };
  }
};
