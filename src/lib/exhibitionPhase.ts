export type ExhibitionPhase = "upcoming" | "live" | "past" | "undated";

// Date-only ("YYYY-MM-DD") comparison — start_date/end_date are Postgres
// `date` columns with no time component, so comparing against a full
// timestamp would misclassify anything happening "today".
export function getExhibitionPhase(startDate: string | null, endDate: string | null): ExhibitionPhase {
  const today = new Date().toISOString().slice(0, 10);

  if (!startDate && !endDate) return "undated";
  if (endDate && endDate < today) return "past";
  if (startDate && startDate > today) return "upcoming";
  return "live";
}
