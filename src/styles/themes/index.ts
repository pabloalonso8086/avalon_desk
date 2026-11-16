/** Available themes. Each one has a CSS file in this folder built from _template.css. */
export const THEMES = ["light", "dark"] as const;
export type Theme = (typeof THEMES)[number];
export const DEFAULT_THEME: Theme = "light";
