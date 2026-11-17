/**
 * Client-side preview of the slug built from a name. The backend has the final say:
 * it makes the slug unique by appending `_2`, `_3`…
 */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Unix seconds -> value of an `<input type="date">` (local date). */
export function toDateInput(seconds: number | null): string {
  if (seconds === null) return "";
  const date = new Date(seconds * 1000);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Value of an `<input type="date">` -> Unix seconds at local midnight. Empty -> null. */
export function fromDateInput(value: string): number | null {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return Math.floor(new Date(year, month - 1, day).getTime() / 1000);
}

/** Unix seconds -> short date in the UI language. */
export function formatDate(seconds: number | null, language: string): string {
  if (seconds === null) return "";
  return new Date(seconds * 1000).toLocaleDateString(language);
}
