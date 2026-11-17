import { useTranslation } from "~/i18n";
import type { ProjectCatalogEntry } from "~/lib/api/projects";
import { ProjectCatalogRow } from "./ProjectCatalogRow";

/** Catalog table of projects, shown below the project form. */
export function ProjectCatalog({
  projects,
  selectedId,
  onSelect,
}: {
  projects: ProjectCatalogEntry[];
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  const t = useTranslation("projectCatalog");
  return (
    <section className="catalog">
      <h2 className="settings-panel__title">{t("title")}</h2>
      {projects.length === 0 ? (
        <p className="catalog__empty">{t("empty")}</p>
      ) : (
        <table className="catalog__table">
          <thead>
            <tr>
              <th>{t("name")}</th>
              <th>{t("slug")}</th>
              <th>{t("status")}</th>
              <th>{t("deadline")}</th>
              <th className="catalog__cell--number">{t("repos")}</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <ProjectCatalogRow
                key={project.id}
                project={project}
                selected={project.id === selectedId}
                onSelect={() => onSelect(project.id)}
              />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
