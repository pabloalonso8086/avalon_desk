import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import type { ProjectMenuEntry } from "~/lib/api/projects";
import { MenuItem } from "./MenuItem";

/**
 * One project in the sidebar menu. Its text is the project's own name (user data).
 * Clicking it opens the project view (ToDo + minion) with only that project's items.
 */
export function ProjectMenuItem({ project }: { project: ProjectMenuEntry }) {
  const navigate = useNavigate();
  const matchRoute = useMatchRoute();
  const projectId = String(project.id);
  const active = Boolean(matchRoute({ to: "/projects/$projectId", params: { projectId } }));

  return (
    <li>
      <MenuItem
        label={project.name}
        active={active}
        onClick={() => void navigate({ to: "/projects/$projectId", params: { projectId } })}
      />
    </li>
  );
}
