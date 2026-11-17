//! SQLite access: connection, migrations and per-entity repositories.

pub mod projects;
pub mod slug;

use rusqlite::Connection;
use std::path::Path;

/// Ordered migrations. The position + 1 is the schema version (`PRAGMA user_version`).
const MIGRATIONS: &[&str] = &[
    include_str!("../../migrations/001_initial_schema.sql"),
    include_str!("../../migrations/002_repos_path_epics_repo.sql"),
];

/// Opens (or creates) the database and applies pending migrations.
pub fn open(path: &Path) -> rusqlite::Result<Connection> {
    let mut conn = Connection::open(path)?;
    configure(&conn)?;
    migrate(&mut conn)?;
    Ok(conn)
}

fn configure(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute_batch("PRAGMA foreign_keys = ON;")?;
    // journal_mode returns a row, so it is run as a query.
    conn.query_row("PRAGMA journal_mode = WAL", [], |_| Ok(()))
}

fn migrate(conn: &mut Connection) -> rusqlite::Result<()> {
    let current: usize = conn.query_row("PRAGMA user_version", [], |row| row.get::<_, i64>(0))? as usize;

    for (index, sql) in MIGRATIONS.iter().enumerate().skip(current) {
        let version = index + 1;
        let tx = conn.transaction()?;
        tx.execute_batch(sql)?;
        tx.execute_batch(&format!("PRAGMA user_version = {version};"))?;
        tx.commit()?;
    }
    Ok(())
}

/// Current Unix timestamp in seconds (all dates are stored as INTEGER).
pub fn now() -> i64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0)
}

#[cfg(test)]
pub fn open_in_memory() -> Connection {
    let mut conn = Connection::open_in_memory().expect("in-memory db");
    configure(&conn).expect("configure");
    migrate(&mut conn).expect("migrate");
    conn
}
