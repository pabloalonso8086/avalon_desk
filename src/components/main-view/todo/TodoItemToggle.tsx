import { useTranslation } from "~/i18n";

/** Button that collapses or expands the lower items of a ToDo item. */
export function TodoItemToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  const t = useTranslation("todoItemToggle");
  const label = expanded ? t("collapse") : t("expand");
  return (
    <button
      type="button"
      className="todo-item__toggle"
      aria-label={label}
      aria-expanded={expanded}
      title={label}
      onClick={onToggle}
    >
      {expanded ? "▾" : "▸"}
    </button>
  );
}
