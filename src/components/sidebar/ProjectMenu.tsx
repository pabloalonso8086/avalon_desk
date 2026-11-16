import { useEffect, useState } from "react";
import { useTranslation } from "~/i18n";
import { listProjects } from "~/lib/api/projects";
import type { ProjectMenuEntry } from "~/lib/api/projects";
import { ProjectMenuItem } from "./ProjectMenuItem";

/** Project list inside the sidebar. Scrolls vertically when it overflows. */
export function ProjectMenu() {
  const t = useTranslation("projectMenu");
  const [projects, setProjects] = useState<ProjectMenuEntry[]>([]);

  useEffect(() => {
    let cancelled = false;
    listProjects()
      .then((result) => {
        if (!cancelled) setProjects(result);
      })
      .catch((error: unknown) => console.error("Could not load projects", error));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="project-menu">
      <div className="project-menu__title">{t("title")}</div>
      <ul className="project-menu__list">
        {projects.length === 0 ? (
          <li className="project-menu__empty">{t("empty")}</li>
        ) : (
          projects.map((project) => <ProjectMenuItem key={project.id} project={project} />)
        )}
      </ul>
    </div>
  );
}
