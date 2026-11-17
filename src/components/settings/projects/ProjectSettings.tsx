import { useCallback, useEffect, useState } from "react";
import { FormMessage } from "~/components/form/FormMessage";
import { useTranslation } from "~/i18n";
import { notifyProjectsChanged } from "~/lib/events";
import { getProject, listProjectCatalog } from "~/lib/api/projects";
import type { ProjectCatalogEntry, ProjectDetail } from "~/lib/api/projects";
import { listRepos } from "~/lib/api/repos";
import type { Repo } from "~/lib/api/repos";
import { listStatuses } from "~/lib/api/statuses";
import type { Status } from "~/lib/api/statuses";
import { ProjectCatalog } from "./ProjectCatalog";
import { ProjectForm } from "./ProjectForm";

/**
 * "Projects" setting: project form on top, catalog below.
 * Data is stored in the database (projects, repos and project_repos tables).
 */
export function ProjectSettings() {
  const t = useTranslation("projectSettings");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [catalog, setCatalog] = useState<ProjectCatalogEntry[]>([]);
  const [editing, setEditing] = useState<ProjectDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [nextRepos, nextCatalog] = await Promise.all([listRepos(), listProjectCatalog()]);
    setRepos(nextRepos);
    setCatalog(nextCatalog);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([listStatuses(), listRepos(), listProjectCatalog()])
      .then(([nextStatuses, nextRepos, nextCatalog]) => {
        if (cancelled) return;
        setStatuses(nextStatuses);
        setRepos(nextRepos);
        setCatalog(nextCatalog);
        setLoaded(true);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(String(reason));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function select(id: number) {
    try {
      const project = await getProject(id);
      setEditing(project);
      setSelectedId(id);
      setFormKey((key) => key + 1);
    } catch (reason) {
      setError(String(reason));
    }
  }

  function saved(project: ProjectDetail) {
    setSelectedId(project.id);
    notifyProjectsChanged();
    reload().catch((reason: unknown) => setError(String(reason)));
  }

  function repoCreated(repo: Repo) {
    setRepos((current) =>
      [...current, repo].sort((a, b) => a.url.localeCompare(b.url, undefined, { sensitivity: "base" })),
    );
  }

  return (
    <div className="settings-panel">
      {error && <FormMessage kind="error" text={`${t("loadError")} ${error}`} />}
      {loaded && (
        <ProjectForm
          key={formKey}
          project={editing}
          statuses={statuses}
          repos={repos}
          onSaved={saved}
          onRepoCreated={repoCreated}
        />
      )}
      <ProjectCatalog projects={catalog} selectedId={selectedId} onSelect={(id) => void select(id)} />
    </div>
  );
}
