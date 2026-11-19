/** Status of a ToDo item. Its name comes from the database and is never translated. */
export function TodoItemStatus({ name }: { name: string }) {
  return <span className="todo-item__status">{name}</span>;
}
