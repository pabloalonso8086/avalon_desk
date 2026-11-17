//! Data access for the `repos` table.
//!
//! Repos are independent entities: projects only link to them through `project_repos`.
//! `path` is the folder of the local git clone, shared by every project linked to the repo.

use rusqlite::{Connection, OptionalExtension};
use serde::Serialize;

/// Error returned when creating a repo whose URL is already registered.
pub const ERROR_URL_EXISTS: &str = "repo_url_exists";

#[derive(Debug, Serialize)]
pub struct Repo {
    pub id: i64,
    pub url: String,
    pub path: Option<String>,
}

#[derive(Debug)]
pub enum CreateError {
    UrlExists,
    Db(rusqlite::Error),
}

impl From<rusqlite::Error> for CreateError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Db(error)
    }
}

impl std::fmt::Display for CreateError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::UrlExists => f.write_str(ERROR_URL_EXISTS),
            Self::Db(error) => error.fmt(f),
        }
    }
}

/// All repos, alphabetically by URL.
pub fn list(conn: &Connection) -> rusqlite::Result<Vec<Repo>> {
    let mut stmt = conn.prepare("SELECT id, url, path FROM repos ORDER BY url COLLATE NOCASE")?;
    let rows = stmt.query_map([], |row| {
        Ok(Repo {
            id: row.get(0)?,
            url: row.get(1)?,
            path: row.get(2)?,
        })
    })?;
    rows.collect()
}

pub fn create(conn: &Connection, url: &str, path: Option<&str>) -> Result<Repo, CreateError> {
    let existing: Option<i64> = conn
        .query_row("SELECT id FROM repos WHERE url = ?1", [url], |row| row.get(0))
        .optional()?;
    if existing.is_some() {
        return Err(CreateError::UrlExists);
    }

    conn.execute("INSERT INTO repos (url, path) VALUES (?1, ?2)", rusqlite::params![url, path])?;
    Ok(Repo {
        id: conn.last_insert_rowid(),
        url: url.to_string(),
        path: path.map(str::to_string),
    })
}

/// Changes the local path of a repo. It affects every project linked to it.
pub fn update_path(conn: &Connection, id: i64, path: Option<&str>) -> rusqlite::Result<()> {
    conn.execute("UPDATE repos SET path = ?1 WHERE id = ?2", rusqlite::params![path, id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::open_in_memory;

    #[test]
    fn rejects_duplicated_url() {
        let conn = open_in_memory();
        create(&conn, "https://example.com/a.git", None).unwrap();
        assert!(matches!(
            create(&conn, "https://example.com/a.git", None),
            Err(CreateError::UrlExists)
        ));
    }

    #[test]
    fn updates_path() {
        let conn = open_in_memory();
        let repo = create(&conn, "https://example.com/a.git", None).unwrap();
        update_path(&conn, repo.id, Some("C:/code/a")).unwrap();
        assert_eq!(list(&conn).unwrap()[0].path.as_deref(), Some("C:/code/a"));
    }
}
