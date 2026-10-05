import { getLocale } from "@/paraglide/runtime";

/**
 * UEG data-display date: YYYY.MM.DD in UTC.
 * Kept separate from `formatPublicPostDate` (whose zh/en formats are a
 * tested contract) so the official-portal look can use the numeric style.
 */
export function formatUegPostDate(
  value: Date | string | number | null | undefined,
  { locale = getLocale() }: { locale?: "zh" | "en" } = {},
) {
  void locale;
  if (value == null) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}
