import { invoke, isTauri } from "@tauri-apps/api/core";

/** Size of a resizable panel, in pixels (`settings.json`). */
export type PanelSize = {
  width: number;
  default_width: number;
  min_width: number;
  max_width: number;
};

/** Settings stored in `settings.json`, next to the executable. */
export type AppSettings = {
  layout: {
    sidebar: PanelSize;
  };
};

/** Same defaults as the backend. Used until settings load, and outside Tauri. */
export const DEFAULT_SIDEBAR_SIZE: PanelSize = {
  width: 240,
  default_width: 240,
  min_width: 180,
  max_width: 480,
};

export async function getSettings(): Promise<AppSettings> {
  if (!isTauri()) return { layout: { sidebar: DEFAULT_SIDEBAR_SIZE } };
  return invoke<AppSettings>("get_settings");
}

/** Saves the sidebar width. The backend clamps it to its limits and returns the stored size. */
export async function setSidebarWidth(width: number): Promise<PanelSize | null> {
  if (!isTauri()) return null;
  return invoke<PanelSize>("set_sidebar_width", { width: Math.round(width) });
}
