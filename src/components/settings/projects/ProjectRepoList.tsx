import { useTranslation } from "~/i18n";
import type { Repo } from "~/lib/api/repos";
import { ProjectRepoItem } from "./ProjectRepoItem";

/** Repositories linked to the project in the form. */
export function ProjectRepoList({
  repos,
  pathOf,
  onPathChange,
  onUnlink,
}: {
  repos: Repo[];
  pathOf: (repo: Repo) => string;
  onPathChange: (repoId: number, path: string) => void;
  onUnlink: (repoId: number) => void;
}) {
  const t = useTranslation("projectRepoList");

  if (repos.length === 0) {
    return <p className="project-repo-list__empty">{t("empty")}</p>;
  }

  return (
    <ul className="project-repo-list">
      {repos.map((repo) => (
        <ProjectRepoItem
          key={repo.id}
          repo={repo}
          path={pathOf(repo)}
          onPathChange={(path) => onPathChange(repo.id, path)}
          onUnlink={() => onUnlink(repo.id)}
        />
      ))}
    </ul>
  );
}
