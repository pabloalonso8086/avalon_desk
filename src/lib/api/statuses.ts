import { invoke, isTauri } from "@tauri-apps/api/core";

/** Status of an item. Its name comes from the database and is never translated. */
export type Status = {
  id: number;
  name: string;
  priority: number;
};

/** Status assigned to new items. */
export const DEFAULT_STATUS_NAME = "Triage";

/** All statuses, highest priority first. Empty outside Tauri. */
export async function listStatuses(): Promise<Status[]> {
  if (!isTauri()) return [];
  return invoke<Status[]>("list_statuses");
}
