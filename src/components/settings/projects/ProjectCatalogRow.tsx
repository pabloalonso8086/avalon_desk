import { useLanguage } from "~/i18n";
import type { ProjectCatalogEntry } from "~/lib/api/projects";
import { formatDate } from "~/lib/format";

/** One project of the catalog. Clicking it loads the project in the form. */
export function ProjectCatalogRow({
  project,
  selected,
  onSelect,
}: {
  project: ProjectCatalogEntry;
  selected: boolean;
  onSelect: () => void;
}) {
  const { language } = useLanguage();
  return (
    <tr
      className={selected ? "catalog__row catalog__row--selected" : "catalog__row"}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter") onSelect();
      }}
    >
      <td>{project.name}</td>
      <td>{project.slug}</td>
      <td>{project.status_name}</td>
      <td>{formatDate(project.deadline, language)}</td>
      <td className="catalog__cell--number">{project.repo_count}</td>
    </tr>
  );
}
