import type { TodoNode } from "~/lib/api/items";
import { TodoItem } from "./TodoItem";

/**
 * One level of the ToDo list. Every level is indented from the left,
 * including the top one (items without a parent item).
 */
export function TodoList({ items }: { items: TodoNode[] }) {
  return (
    <ul className="todo-list">
      {items.map((item) => (
        <TodoItem key={item.key} item={item} />
      ))}
    </ul>
  );
}
