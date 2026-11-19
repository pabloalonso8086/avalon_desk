//! Read access to the item hierarchy of a project (epics > macros > tasks) for the ToDo view.

use std::collections::HashMap;

use rusqlite::{params, Connection};
use serde::Serialize;

/// Task of a macro. It inherits branch and issue from its macro.
#[derive(Debug, Serialize)]
pub struct TaskNode {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status_id: i64,
    pub status_name: String,
    pub deadline: Option<i64>,
}

/// Macro, either inside an epic or directly under the project, with its tasks.
#[derive(Debug, Serialize)]
pub struct MacroNode {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status_id: i64,
    pub status_name: String,
    pub deadline: Option<i64>,
    pub branch: Option<String>,
    pub issue: Option<String>,
    pub repo_id: Option<i64>,
    pub tasks: Vec<TaskNode>,
}

/// Epic of the project, with its macros.
#[derive(Debug, Serialize)]
pub struct EpicNode {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status_id: i64,
    pub status_name: String,
    pub deadline: Option<i64>,
    pub repo_id: Option<i64>,
    pub macros: Vec<MacroNode>,
}

/// Every item of one project: its epics (with their macros) and the macros
/// that hang directly from the project. Items are ordered by creation (id).
#[derive(Debug, Serialize)]
pub struct ProjectTree {
    pub project_id: i64,
    pub epics: Vec<EpicNode>,
    pub macros: Vec<MacroNode>,
}

/// Ids of the macros of the project: direct ones and those inside its epics.
const PROJECT_MACRO_IDS: &str = "SELECT id FROM macros
     WHERE project_id = ?1
        OR epic_id IN (SELECT id FROM epics WHERE project_id = ?1)";

/// Loads the epics, macros and tasks that belong to the project, and only those.
pub fn project_tree(conn: &Connection, project_id: i64) -> rusqlite::Result<ProjectTree> {
    let mut tasks_by_macro = load_tasks(conn, project_id)?;

    // Macros, split between the project (no epic) and each epic.
    let mut direct_macros = Vec::new();
    let mut macros_by_epic: HashMap<i64, Vec<MacroNode>> = HashMap::new();
    let mut stmt = conn.prepare(&format!(
        "SELECT m.id, m.name, m.slug, m.status_id, s.name, m.deadline,
                m.branch, m.issue, m.repo_id, m.epic_id
         FROM macros m
         JOIN statuses s ON s.id = m.status_id
         WHERE m.id IN ({PROJECT_MACRO_IDS})
         ORDER BY m.id"
    ))?;
    let mut rows = stmt.query(params![project_id])?;
    while let Some(row) = rows.next()? {
        let id: i64 = row.get(0)?;
        let node = MacroNode {
            id,
            name: row.get(1)?,
            slug: row.get(2)?,
            status_id: row.get(3)?,
            status_name: row.get(4)?,
            deadline: row.get(5)?,
            branch: row.get(6)?,
            issue: row.get(7)?,
            repo_id: row.get(8)?,
            tasks: tasks_by_macro.remove(&id).unwrap_or_default(),
        };
        match row.get::<_, Option<i64>>(9)? {
            Some(epic_id) => macros_by_epic.entry(epic_id).or_default().push(node),
            None => direct_macros.push(node),
        }
    }

    let mut stmt = conn.prepare(
        "SELECT e.id, e.name, e.slug, e.status_id, s.name, e.deadline, e.repo_id
         FROM epics e
         JOIN statuses s ON s.id = e.status_id
         WHERE e.project_id = ?1
         ORDER BY e.id",
    )?;
    let mut epics = Vec::new();
    let mut rows = stmt.query(params![project_id])?;
    while let Some(row) = rows.next()? {
        let id: i64 = row.get(0)?;
        epics.push(EpicNode {
            id,
            name: row.get(1)?,
            slug: row.get(2)?,
            status_id: row.get(3)?,
            status_name: row.get(4)?,
            deadline: row.get(5)?,
            repo_id: row.get(6)?,
            macros: macros_by_epic.remove(&id).unwrap_or_default(),
        });
    }

    Ok(ProjectTree {
        project_id,
        epics,
        macros: direct_macros,
    })
}

/// Tasks of every macro of the project, grouped by macro id.
fn load_tasks(conn: &Connection, project_id: i64) -> rusqlite::Result<HashMap<i64, Vec<TaskNode>>> {
    let mut stmt = conn.prepare(&format!(
        "SELECT t.id, t.name, t.slug, t.status_id, s.name, t.deadline, t.macro_id
         FROM tasks t
         JOIN statuses s ON s.id = t.status_id
         WHERE t.macro_id IN ({PROJECT_MACRO_IDS})
         ORDER BY t.id"
    ))?;
    let mut tasks: HashMap<i64, Vec<TaskNode>> = HashMap::new();
    let mut rows = stmt.query(params![project_id])?;
    while let Some(row) = rows.next()? {
        let macro_id: i64 = row.get(6)?;
        tasks.entry(macro_id).or_default().push(TaskNode {
            id: row.get(0)?,
            name: row.get(1)?,
            slug: row.get(2)?,
            status_id: row.get(3)?,
            status_name: row.get(4)?,
            deadline: row.get(5)?,
        });
    }
    Ok(tasks)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::open_in_memory;
    use crate::db::statuses;

    fn triage(conn: &Connection) -> i64 {
        statuses::id_by_name(conn, "Triage").unwrap()
    }

    fn insert_project(conn: &Connection, slug: &str) -> i64 {
        conn.execute(
            "INSERT INTO projects (name, slug, status_id, created_at, updated_at) VALUES (?1, ?1, ?2, 0, 0)",
            params![slug, triage(conn)],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    fn insert_epic(conn: &Connection, slug: &str, project_id: i64) -> i64 {
        conn.execute(
            "INSERT INTO epics (name, slug, status_id, created_at, updated_at, project_id)
             VALUES (?1, ?1, ?2, 0, 0, ?3)",
            params![slug, triage(conn), project_id],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    fn insert_macro(conn: &Connection, slug: &str, project_id: Option<i64>, epic_id: Option<i64>) -> i64 {
        conn.execute(
            "INSERT INTO macros (name, slug, status_id, created_at, updated_at, project_id, epic_id)
             VALUES (?1, ?1, ?2, 0, 0, ?3, ?4)",
            params![slug, triage(conn), project_id, epic_id],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    fn insert_task(conn: &Connection, slug: &str, macro_id: i64) {
        conn.execute(
            "INSERT INTO tasks (name, slug, status_id, created_at, updated_at, macro_id)
             VALUES (?1, ?1, ?2, 0, 0, ?3)",
            params![slug, triage(conn), macro_id],
        )
        .unwrap();
    }

    #[test]
    fn empty_project_has_no_items() {
        let conn = open_in_memory();
        let project = insert_project(&conn, "empty");
        let tree = project_tree(&conn, project).unwrap();
        assert!(tree.epics.is_empty());
        assert!(tree.macros.is_empty());
    }

    #[test]
    fn only_returns_items_of_the_project() {
        let conn = open_in_memory();
        let a = insert_project(&conn, "a");
        let b = insert_project(&conn, "b");

        let epic_a = insert_epic(&conn, "epic-a", a);
        let macro_in_epic_a = insert_macro(&conn, "macro-epic-a", None, Some(epic_a));
        let macro_direct_a = insert_macro(&conn, "macro-direct-a", Some(a), None);
        insert_task(&conn, "task-epic-a", macro_in_epic_a);
        insert_task(&conn, "task-direct-a", macro_direct_a);

        let epic_b = insert_epic(&conn, "epic-b", b);
        let macro_in_epic_b = insert_macro(&conn, "macro-epic-b", None, Some(epic_b));
        let macro_direct_b = insert_macro(&conn, "macro-direct-b", Some(b), None);
        insert_task(&conn, "task-epic-b", macro_in_epic_b);
        insert_task(&conn, "task-direct-b", macro_direct_b);

        let tree = project_tree(&conn, a).unwrap();
        assert_eq!(tree.project_id, a);

        assert_eq!(tree.epics.len(), 1);
        assert_eq!(tree.epics[0].slug, "epic-a");
        assert_eq!(tree.epics[0].status_name, "Triage");
        assert_eq!(tree.epics[0].macros.len(), 1);
        assert_eq!(tree.epics[0].macros[0].slug, "macro-epic-a");
        assert_eq!(tree.epics[0].macros[0].tasks.len(), 1);
        assert_eq!(tree.epics[0].macros[0].tasks[0].slug, "task-epic-a");

        assert_eq!(tree.macros.len(), 1);
        assert_eq!(tree.macros[0].slug, "macro-direct-a");
        assert_eq!(tree.macros[0].tasks.len(), 1);
        assert_eq!(tree.macros[0].tasks[0].slug, "task-direct-a");
    }
}
