//! Data access for the `statuses` table.

use rusqlite::Connection;
use serde::Serialize;

/// Status assigned to new items.
pub const DEFAULT_STATUS: &str = "Triage";

/// Statuses that close an item: `closed_at` is filled when an item reaches one of them.
const CLOSING_STATUSES: [&str; 2] = ["Done", "Canceled"];

#[derive(Debug, Serialize)]
pub struct Status {
    pub id: i64,
    pub name: String,
    pub priority: i64,
}

/// All statuses, highest priority first.
pub fn list(conn: &Connection) -> rusqlite::Result<Vec<Status>> {
    let mut stmt = conn.prepare("SELECT id, name, priority FROM statuses ORDER BY priority DESC")?;
    let rows = stmt.query_map([], |row| {
        Ok(Status {
            id: row.get(0)?,
            name: row.get(1)?,
            priority: row.get(2)?,
        })
    })?;
    rows.collect()
}

pub fn id_by_name(conn: &Connection, name: &str) -> rusqlite::Result<i64> {
    conn.query_row("SELECT id FROM statuses WHERE name = ?1", [name], |row| row.get(0))
}

/// Whether the status closes the item (Done or Canceled).
pub fn is_closing(conn: &Connection, status_id: i64) -> rusqlite::Result<bool> {
    let name: String = conn.query_row("SELECT name FROM statuses WHERE id = ?1", [status_id], |row| row.get(0))?;
    Ok(CLOSING_STATUSES.contains(&name.as_str()))
}
