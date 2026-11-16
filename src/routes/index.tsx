import { createFileRoute } from "@tanstack/react-router";

/** Main view container starts empty: Home has no functionality yet. */
export const Route = createFileRoute("/")({
  component: () => null,
});
