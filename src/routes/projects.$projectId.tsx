import { createFileRoute } from "@tanstack/react-router";

/**
 * Project route. It renders nothing by itself: the project views live in
 * `ProjectViewHost`, outside the router outlet, so each one stays in memory
 * (and keeps its terminal) when switching to another project or view.
 */
export const Route = createFileRoute("/projects/$projectId")({
  component: () => null,
});
