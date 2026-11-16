//! Data access for the `projects` table.

use rusqlite::Connection;
use serde::Serialize;

use super::slug::{unique_slug, SlugTable};

/// Status assigned to new projects.
const DEFAULT_STATUS: &str = "Triage";

#[derive(Debug, Serialize)]
pub struct ProjectMenuEntry {
    pub id: i64,
    pub slug: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status_id: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub closed_at: Option<i64>,
    pub deadline: Option<i64>,
}

/// Projects for the sidebar menu, alphabetically.
pub fn list_menu(conn: &Connection) -> rusqlite::Result<Vec<ProjectMenuEntry>> {
    let mut stmt = conn.prepare("SELECT id, slug, name FROM projects ORDER BY name COLLATE NOCASE")?;
    let rows = stmt.query_map([], |row| {
        Ok(ProjectMenuEntry {
            id: row.get(0)?,
            slug: row.get(1)?,
            name: row.get(2)?,
        })
    })?;
    rows.collect()
}

/// Creates a project with a unique slug and the default status.
pub fn create(conn: &Connection, name: &str) -> rusqlite::Result<Project> {
    let slug = unique_slug(conn, SlugTable::Projects, name)?;
    let status_id: i64 = conn.query_row(
        "SELECT id FROM statuses WHERE name = ?1",
        [DEFAULT_STATUS],
        |row| row.get(0),
    )?;
    let now = super::now();

    conn.execute(
        "INSERT INTO projects (name, slug, status_id, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?4)",
        rusqlite::params![name, slug, status_id, now],
    )?;

    Ok(Project {
        id: conn.last_insert_rowid(),
        name: name.to_string(),
        slug,
        status_id,
        created_at: now,
        updated_at: now,
        closed_at: None,
        deadline: None,
    })
}
