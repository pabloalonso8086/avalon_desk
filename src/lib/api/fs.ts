import { invoke, isTauri } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

/** Whether the path is an existing folder. Outside Tauri it cannot be checked, so it is accepted. */
export async function pathExists(path: string): Promise<boolean> {
  if (!isTauri()) return true;
  return invoke<boolean>("path_exists", { path });
}

/** Opens the native folder picker. Returns `null` when cancelled or outside Tauri. */
export async function pickFolder(title: string, defaultPath?: string): Promise<string | null> {
  if (!isTauri()) return null;
  const result = await open({ directory: true, multiple: false, title, defaultPath: defaultPath || undefined });
  return typeof result === "string" ? result : null;
}
