import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";

/** Window actions for the custom title bar. They do nothing outside Tauri (plain browser). */

export async function minimizeWindow(): Promise<void> {
  if (isTauri()) await getCurrentWindow().minimize();
}

export async function toggleMaximizeWindow(): Promise<void> {
  if (isTauri()) await getCurrentWindow().toggleMaximize();
}

export async function closeWindow(): Promise<void> {
  if (isTauri()) await getCurrentWindow().close();
}

export async function isWindowMaximized(): Promise<boolean> {
  return isTauri() ? getCurrentWindow().isMaximized() : false;
}

/** Calls `handler` with the maximized state now and on every resize. Returns the unsubscribe. */
export async function watchWindowMaximized(handler: (maximized: boolean) => void): Promise<() => void> {
  if (!isTauri()) return () => {};
  const window = getCurrentWindow();
  handler(await window.isMaximized());
  return window.onResized(() => {
    void window.isMaximized().then(handler);
  });
}
