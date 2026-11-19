import { useState } from "react";
import type { TodoNode } from "~/lib/api/items";
import { TodoItemStatus } from "./TodoItemStatus";
import { TodoItemToggle } from "./TodoItemToggle";
import { TodoItemType } from "./TodoItemType";
import { TodoList } from "./TodoList";

/**
 * One epic, macro or task, with its lower items nested below.
 * Items with children can be collapsed and expanded. Name and status come from the
 * database and are shown as they are (not translated).
 */
export function TodoItem({ item }: { item: TodoNode }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = item.children.length > 0;

  return (
    <li className={`todo-item todo-item--${item.type}`}>
      <div className="todo-item__row">
        {hasChildren ? (
          <TodoItemToggle expanded={expanded} onToggle={() => setExpanded((value) => !value)} />
        ) : (
          <span className="todo-item__toggle-spacer" />
        )}
        <TodoItemType type={item.type} />
        <span className="todo-item__name" title={item.name}>
          {item.name}
        </span>
        <TodoItemStatus name={item.status_name} />
      </div>
      {hasChildren && expanded && <TodoList items={item.children} />}
    </li>
  );
}
