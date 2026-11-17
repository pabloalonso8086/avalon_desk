import { invoke, isTauri } from "@tauri-apps/api/core";

/** Minimal project data used by the sidebar menu. */
export type ProjectMenuEntry = {
  id: number;
  slug: string;
  name: string;
};

/** Row of the project catalog (Projects setting). */
export type ProjectCatalogEntry = {
  id: number;
  name: string;
  slug: string;
  status_name: string;
  deadline: number | null;
  repo_count: number;
};

/** Full project, with the ids of its linked repos. Dates are Unix seconds. */
export type ProjectDetail = {
  id: number;
  name: string;
  slug: string;
  status_id: number;
  created_at: number;
  updated_at: number;
  closed_at: number | null;
  deadline: number | null;
  repo_ids: number[];
  /** Whether the project has epics or macros. Its status is then locked in the form. */
  has_children: boolean;
};

/** Data sent by the project form. An empty slug is generated from the name. */
export type ProjectInput = {
  name: string;
  slug: string;
  status_id: number | null;
  deadline: number | null;
  repo_ids: number[];
};

/** Lists the projects shown in the sidebar menu. Empty outside Tauri (plain browser). */
export async function listProjects(): Promise<ProjectMenuEntry[]> {
  if (!isTauri()) return [];
  return invoke<ProjectMenuEntry[]>("list_projects");
}

/** Lists the projects of the catalog table. Empty outside Tauri. */
export async function listProjectCatalog(): Promise<ProjectCatalogEntry[]> {
  if (!isTauri()) return [];
  return invoke<ProjectCatalogEntry[]>("list_project_catalog");
}

export async function getProject(id: number): Promise<ProjectDetail> {
  return invoke<ProjectDetail>("get_project", { id });
}

export async function createProject(input: ProjectInput): Promise<ProjectDetail> {
  return invoke<ProjectDetail>("create_project", { input });
}

export async function updateProject(id: number, input: ProjectInput): Promise<ProjectDetail> {
  return invoke<ProjectDetail>("update_project", { id, input });
}
