import { invoke, isTauri } from "@tauri-apps/api/core";

/** Task of a macro. It inherits branch and issue from its macro. */
export type TaskNode = {
  id: number;
  name: string;
  slug: string;
  status_id: number;
  status_name: string;
  deadline: number | null;
};

/** Macro, inside an epic or directly under the project, with its tasks. */
export type MacroNode = {
  id: number;
  name: string;
  slug: string;
  status_id: number;
  status_name: string;
  deadline: number | null;
  branch: string | null;
  issue: string | null;
  repo_id: number | null;
  tasks: TaskNode[];
};

/** Epic of the project, with its macros. */
export type EpicNode = {
  id: number;
  name: string;
  slug: string;
  status_id: number;
  status_name: string;
  deadline: number | null;
  repo_id: number | null;
  macros: MacroNode[];
};

/** Items of one project: its epics and the macros that hang directly from it. */
export type ProjectTree = {
  project_id: number;
  epics: EpicNode[];
  macros: MacroNode[];
};

export type ItemType = "epic" | "macro" | "task";

/** Any item of the ToDo list, with its lower items nested. */
export type TodoNode = {
  /** Unique across types (ids repeat between tables). */
  key: string;
  type: ItemType;
  id: number;
  name: string;
  status_name: string;
  children: TodoNode[];
};

/** Epics, macros and tasks of the project, and only those. Empty outside Tauri. */
export async function getProjectTree(projectId: number): Promise<ProjectTree> {
  if (!isTauri()) return { project_id: projectId, epics: [], macros: [] };
  return invoke<ProjectTree>("get_project_tree", { projectId });
}

function taskNode(task: TaskNode): TodoNode {
  return { key: `task_${task.id}`, type: "task", id: task.id, name: task.name, status_name: task.status_name, children: [] };
}

function macroNode(macro: MacroNode): TodoNode {
  return {
    key: `macro_${macro.id}`,
    type: "macro",
    id: macro.id,
    name: macro.name,
    status_name: macro.status_name,
    children: macro.tasks.map(taskNode),
  };
}

function epicNode(epic: EpicNode): TodoNode {
  return {
    key: `epic_${epic.id}`,
    type: "epic",
    id: epic.id,
    name: epic.name,
    status_name: epic.status_name,
    children: epic.macros.map(macroNode),
  };
}

/** Top level of the ToDo list: epics first, then the macros without epic. */
export function toTodoNodes(tree: ProjectTree): TodoNode[] {
  return [...tree.epics.map(epicNode), ...tree.macros.map(macroNode)];
}
