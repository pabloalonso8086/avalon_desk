import { useMatchRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MainView } from "~/components/main-view/MainView";

/**
 * Keeps the `MainView` of every opened project mounted, showing only the active one.
 * A project view is never destroyed when switching projects (or opening Settings),
 * so its terminal stays alive.
 */
export function ProjectViewHost() {
  const matchRoute = useMatchRoute();
  const match = matchRoute({ to: "/projects/$projectId" });
  const parsed = match ? Number(match.projectId) : NaN;
  const activeId = Number.isInteger(parsed) ? parsed : null;
  const [opened, setOpened] = useState<number[]>([]);

  useEffect(() => {
    if (activeId !== null) {
      setOpened((current) => (current.includes(activeId) ? current : [...current, activeId]));
    }
  }, [activeId]);

  return (
    <>
      {opened.map((projectId) => (
        <MainView key={projectId} projectId={projectId} active={projectId === activeId} />
      ))}
    </>
  );
}
