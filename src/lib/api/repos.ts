import { invoke, isTauri } from "@tauri-apps/api/core";

/**
 * Git repository. Repos are independent entities linked to projects.
 * `path` is the folder of the local clone, shared by every project linked to the repo.
 */
export type Repo = {
  id: number;
  url: string;
  path: string | null;
};

/** All repos, alphabetically by URL. Empty outside Tauri. */
export async function listRepos(): Promise<Repo[]> {
  if (!isTauri()) return [];
  return invoke<Repo[]>("list_repos");
}

/** Creates a repo. Fails with `repo_url_exists` or `repo_url_required`. */
export async function createRepo(url: string, path: string): Promise<Repo> {
  return invoke<Repo>("create_repo", { url, path });
}

/** Changes the local path of a repo (affects every project linked to it). */
export async function updateRepoPath(id: number, path: string): Promise<void> {
  return invoke<void>("update_repo_path", { id, path });
}
