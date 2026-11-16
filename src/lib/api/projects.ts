import { invoke, isTauri } from "@tauri-apps/api/core";

/** Minimal project data used by the sidebar menu. */
export type ProjectMenuEntry = {
  id: number;
  slug: string;
  name: string;
};

/** Lists the projects shown in the sidebar menu. Empty outside Tauri (plain browser). */
export async function listProjects(): Promise<ProjectMenuEntry[]> {
  if (!isTauri()) return [];
  return invoke<ProjectMenuEntry[]>("list_projects");
}
