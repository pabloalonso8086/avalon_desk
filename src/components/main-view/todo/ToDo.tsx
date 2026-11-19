import { useEffect, useState } from "react";
import { useTranslation } from "~/i18n";
import { getProjectTree, toTodoNodes } from "~/lib/api/items";
import type { TodoNode } from "~/lib/api/items";
import { TodoList } from "./TodoList";

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: TodoNode[] };

/**
 * Epics, macros and tasks of one project, nested by hierarchy.
 * Reloads every time the project view becomes active, to pick up external changes.
 */
export function ToDo({ projectId, active }: { projectId: number; active: boolean }) {
  const t = useTranslation("todo");
  const [state, setState] = useState<LoadState>({ kind: "loading" });

  useEffect(() => {
    if (!active) return;
    let cancelled = false;
    getProjectTree(projectId)
      .then((tree) => {
        if (!cancelled) setState({ kind: "ready", items: toTodoNodes(tree) });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ kind: "error", message: String(error) });
      });
    return () => {
      cancelled = true;
    };
  }, [projectId, active]);

  return (
    <div className="todo">
      <h2 className="todo__title">{t("title")}</h2>
      {state.kind === "loading" && <p className="todo__message">{t("loading")}</p>}
      {state.kind === "error" && (
        <p className="todo__message todo__message--error">
          {t("loadError")} {state.message}
        </p>
      )}
      {state.kind === "ready" &&
        (state.items.length === 0 ? (
          <p className="todo__message">{t("empty")}</p>
        ) : (
          <TodoList items={state.items} />
        ))}
    </div>
  );
}
