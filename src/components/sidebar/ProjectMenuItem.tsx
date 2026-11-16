import type { ProjectMenuEntry } from "~/lib/api/projects";
import { MenuItem } from "./MenuItem";

/** One project in the sidebar menu. Its text is the project's own name (user data). */
export function ProjectMenuItem({ project }: { project: ProjectMenuEntry }) {
  return (
    <li>
      <MenuItem label={project.name} />
    </li>
  );
}
