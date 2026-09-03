/**
 * Small date/time formatters shared by the report screens. Kept free of
 * `server-only` imports so client and server components can both use them.
 *
 * The backend serialises week bounds as calendar dates (`YYYY-MM-DD`);
 * constructing them with explicit y/m/d parts avoids the UTC-midnight shift
 * `new Date("2026-09-01")` would introduce in negative-offset time zones.
 */

export function formatDate(iso: string): string {
  const parts = iso.slice(0, 10).split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts.map(Number);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(y, m - 1, d).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return iso;
}

export function formatWeekRange(start: string, end: string): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDateTime(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
