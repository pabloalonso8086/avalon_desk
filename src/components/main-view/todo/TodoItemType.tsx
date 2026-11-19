import { useTranslation } from "~/i18n";
import type { ItemType } from "~/lib/api/items";

/** Badge with the type of a ToDo item: epic, macro or task. */
export function TodoItemType({ type }: { type: ItemType }) {
  const t = useTranslation("todoItemType");
  return <span className={`todo-item__type todo-item__type--${type}`}>{t(type)}</span>;
}
