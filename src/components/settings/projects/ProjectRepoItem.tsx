import { Button } from "~/components/form/Button";
import { PathField } from "~/components/form/PathField";
import { useTranslation } from "~/i18n";
import type { Repo } from "~/lib/api/repos";

/**
 * A repository linked to the project: URL, editable local path and "Unlink".
 * The path belongs to the repo, so changing it affects every project linked to it.
 * Unlinking only removes the link, never the repository.
 */
export function ProjectRepoItem({
  repo,
  path,
  onPathChange,
  onUnlink,
}: {
  repo: Repo;
  path: string;
  onPathChange: (path: string) => void;
  onUnlink: () => void;
}) {
  const t = useTranslation("projectRepoItem");
  return (
    <li className="project-repo-item">
      <div className="project-repo-item__header">
        <span className="project-repo-item__url" title={repo.url}>
          {repo.url}
        </span>
        <Button label={t("unlink")} variant="secondary" onClick={onUnlink} />
      </div>
      <PathField label={t("path")} value={path} onChange={onPathChange} />
    </li>
  );
}
