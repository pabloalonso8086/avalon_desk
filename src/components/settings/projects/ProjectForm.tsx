import { useState } from "react";
import type { FormEvent } from "react";
import { Button } from "~/components/form/Button";
import { DateField } from "~/components/form/DateField";
import { FormMessage } from "~/components/form/FormMessage";
import { TextField } from "~/components/form/TextField";
import { useTranslation } from "~/i18n";
import { createProject, updateProject } from "~/lib/api/projects";
import type { ProjectDetail, ProjectInput } from "~/lib/api/projects";
import { updateRepoPath } from "~/lib/api/repos";
import type { Repo } from "~/lib/api/repos";
import { DEFAULT_STATUS_NAME } from "~/lib/api/statuses";
import type { Status } from "~/lib/api/statuses";
import { fromDateInput, slugify, toDateInput } from "~/lib/format";
import { NewRepoForm } from "./NewRepoForm";
import { ProjectRepoList } from "./ProjectRepoList";
import { RepoPicker } from "./RepoPicker";
import { StatusSelect } from "./StatusSelect";

type Message = { kind: "success" | "error"; text: string };

/**
 * Create / edit form of a project. Empty (`project` null) it shows "Create";
 * filled from the catalog it shows "Update".
 * The parent remounts it (via `key`) to load another project or reset it.
 */
export function ProjectForm({
  project,
  statuses,
  repos,
  onSaved,
  onRepoCreated,
}: {
  project: ProjectDetail | null;
  statuses: Status[];
  repos: Repo[];
  onSaved: (project: ProjectDetail) => void;
  onRepoCreated: (repo: Repo) => void;
}) {
  const t = useTranslation("projectForm");
  const defaultStatusId = statuses.find((s) => s.name === DEFAULT_STATUS_NAME)?.id ?? statuses[0]?.id ?? null;

  const [projectId, setProjectId] = useState<number | null>(project?.id ?? null);
  const [name, setName] = useState(project?.name ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");
  // While the slug has not been edited by hand, it follows the name.
  const [slugEdited, setSlugEdited] = useState(project !== null);
  const [statusId, setStatusId] = useState<number | null>(project?.status_id ?? null);
  const [deadline, setDeadline] = useState(toDateInput(project?.deadline ?? null));
  const [repoIds, setRepoIds] = useState<number[]>(project?.repo_ids ?? []);
  // Local paths edited in the form, by repo id. Saved on the repo itself.
  const [paths, setPaths] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);

  const linkedRepos = repoIds
    .map((id) => repos.find((repo) => repo.id === id))
    .filter((repo): repo is Repo => repo !== undefined);
  const availableRepos = repos.filter((repo) => !repoIds.includes(repo.id));
  const pathOf = (repo: Repo) => paths[repo.id] ?? repo.path ?? "";
  // With epics or macros, the project status only changes through propagation.
  const statusLocked = project?.has_children ?? false;

  function changeName(value: string) {
    setName(value);
    if (!slugEdited) setSlug(slugify(value));
  }

  function changeSlug(value: string) {
    setSlug(value);
    setSlugEdited(value !== "");
  }

  function linkRepo(repoId: number) {
    setRepoIds((ids) => (ids.includes(repoId) ? ids : [...ids, repoId]));
  }

  function repoCreated(repo: Repo) {
    onRepoCreated(repo);
    linkRepo(repo.id);
  }

  function errorText(code: string): string {
    if (code === "project_name_required") return t("errorNameRequired");
    return `${t("errorGeneric")} ${code}`;
  }

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      // Paths first: they belong to the repos, not to the project.
      for (const repo of linkedRepos) {
        const path = pathOf(repo).trim();
        if (path !== (repo.path ?? "")) await updateRepoPath(repo.id, path);
      }

      const input: ProjectInput = {
        name,
        slug,
        status_id: statusId ?? defaultStatusId,
        deadline: fromDateInput(deadline),
        repo_ids: repoIds,
      };
      const saved = projectId === null ? await createProject(input) : await updateProject(projectId, input);

      setProjectId(saved.id);
      setSlug(saved.slug);
      setSlugEdited(true);
      setMessage({ kind: "success", text: t("saved") });
      onSaved(saved);
    } catch (reason) {
      setMessage({ kind: "error", text: errorText(String(reason)) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="project-form" onSubmit={(event) => void save(event)}>
      <h2 className="settings-panel__title">{projectId === null ? t("titleNew") : t("titleEdit")}</h2>

      <div className="form-grid">
        <TextField label={t("name")} value={name} onChange={changeName} autoFocus />
        <TextField label={t("slug")} value={slug} onChange={changeSlug} hint={t("slugHint")} />
        <StatusSelect
          label={t("status")}
          statuses={statuses}
          value={statusId ?? defaultStatusId}
          onChange={setStatusId}
          disabled={statusLocked}
          hint={statusLocked ? t("statusLocked") : undefined}
        />
        <DateField label={t("deadline")} value={deadline} onChange={setDeadline} />
      </div>

      <h3 className="project-form__section">{t("repos")}</h3>
      <ProjectRepoList
        repos={linkedRepos}
        pathOf={pathOf}
        onPathChange={(repoId, path) => setPaths((current) => ({ ...current, [repoId]: path }))}
        onUnlink={(repoId) => setRepoIds((ids) => ids.filter((id) => id !== repoId))}
      />
      <RepoPicker repos={availableRepos} onLink={linkRepo} />
      <NewRepoForm onCreated={repoCreated} />

      <div className="form-actions">
        <Button
          type="submit"
          label={projectId === null ? t("create") : t("update")}
          disabled={busy || !name.trim()}
        />
      </div>
      {message && <FormMessage kind={message.kind} text={message.text} />}
    </form>
  );
}
