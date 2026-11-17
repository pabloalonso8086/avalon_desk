//! Data access for the `projects` table and its links to repos (`project_repos`).

use rusqlite::Connection;
use serde::{Deserialize, Serialize};

use super::slug::{unique_slug_excluding, SlugTable};
use super::statuses;

/// Error returned when a project is saved without a name.
pub const ERROR_NAME_REQUIRED: &str = "project_name_required";

#[derive(Debug, Serialize)]
pub struct ProjectMenuEntry {
    pub id: i64,
    pub slug: String,
    pub name: String,
}

/// Row of the project catalog shown in the Projects setting.
#[derive(Debug, Serialize)]
pub struct ProjectCatalogEntry {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status_name: String,
    pub deadline: Option<i64>,
    pub repo_count: i64,
}

/// Full project, with the ids of its linked repos.
#[derive(Debug, Serialize)]
pub struct ProjectDetail {
    pub id: i64,
    pub name: String,
    pub slug: String,
    pub status_id: i64,
    pub created_at: i64,
    pub updated_at: i64,
    pub closed_at: Option<i64>,
    pub deadline: Option<i64>,
    pub repo_ids: Vec<i64>,
    /// Whether the project has epics or macros. Its status is then locked in the form.
    pub has_children: bool,
}

/// Data sent by the project form.
#[derive(Debug, Deserialize)]
pub struct ProjectInput {
    pub name: String,
    /// Empty: generated from the name. Otherwise it is slugified and made unique.
    #[serde(default)]
    pub slug: String,
    /// `None`: the default status (Triage).
    pub status_id: Option<i64>,
    pub deadline: Option<i64>,
    #[serde(default)]
    pub repo_ids: Vec<i64>,
}

#[derive(Debug)]
pub enum SaveError {
    NameRequired,
    Db(rusqlite::Error),
}

impl From<rusqlite::Error> for SaveError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Db(error)
    }
}

impl std::fmt::Display for SaveError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::NameRequired => f.write_str(ERROR_NAME_REQUIRED),
            Self::Db(error) => error.fmt(f),
        }
    }
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

/// Projects for the catalog table, alphabetically.
pub fn list_catalog(conn: &Connection) -> rusqlite::Result<Vec<ProjectCatalogEntry>> {
    let mut stmt = conn.prepare(
        "SELECT p.id, p.name, p.slug, s.name, p.deadline,
                (SELECT COUNT(*) FROM project_repos pr WHERE pr.project_id = p.id)
         FROM projects p
         JOIN statuses s ON s.id = p.status_id
         ORDER BY p.name COLLATE NOCASE",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(ProjectCatalogEntry {
            id: row.get(0)?,
            name: row.get(1)?,
            slug: row.get(2)?,
            status_name: row.get(3)?,
            deadline: row.get(4)?,
            repo_count: row.get(5)?,
        })
    })?;
    rows.collect()
}

pub fn get(conn: &Connection, id: i64) -> rusqlite::Result<ProjectDetail> {
    let mut detail = conn.query_row(
        "SELECT id, name, slug, status_id, created_at, updated_at, closed_at, deadline,
                EXISTS(SELECT 1 FROM epics WHERE project_id = projects.id)
                OR EXISTS(SELECT 1 FROM macros WHERE project_id = projects.id)
         FROM projects WHERE id = ?1",
        [id],
        |row| {
            Ok(ProjectDetail {
                id: row.get(0)?,
                name: row.get(1)?,
                slug: row.get(2)?,
                status_id: row.get(3)?,
                created_at: row.get(4)?,
                updated_at: row.get(5)?,
                closed_at: row.get(6)?,
                deadline: row.get(7)?,
                repo_ids: Vec::new(),
                has_children: row.get(8)?,
            })
        },
    )?;

    let mut stmt = conn.prepare("SELECT repo_id FROM project_repos WHERE project_id = ?1 ORDER BY id")?;
    detail.repo_ids = stmt
        .query_map([id], |row| row.get(0))?
        .collect::<rusqlite::Result<_>>()?;
    Ok(detail)
}

/// Creates a project and links its repos.
pub fn create(conn: &Connection, input: &ProjectInput) -> Result<ProjectDetail, SaveError> {
    let name = required_name(input)?;
    let tx = conn.unchecked_transaction()?;

    let slug = resolve_slug(&tx, input, name, None)?;
    let status_id = resolve_status(&tx, input)?;
    let closed_at = closed_at_for(&tx, status_id, None)?;
    let now = super::now();

    tx.execute(
        "INSERT INTO projects (name, slug, status_id, created_at, updated_at, closed_at, deadline)
         VALUES (?1, ?2, ?3, ?4, ?4, ?5, ?6)",
        rusqlite::params![name, slug, status_id, now, closed_at, input.deadline],
    )?;
    let id = tx.last_insert_rowid();
    replace_repos(&tx, id, &input.repo_ids)?;
    tx.commit()?;

    Ok(get(conn, id)?)
}

/// Updates a project and replaces its repo links. Unlinking a repo never deletes it.
/// If the project has epics or macros, its status is locked here: the one received is
/// ignored and the current one is kept (it changes through propagation instead).
pub fn update(conn: &Connection, id: i64, input: &ProjectInput) -> Result<ProjectDetail, SaveError> {
    let name = required_name(input)?;
    let tx = conn.unchecked_transaction()?;

    let (current_status_id, current_closed_at, has_children): (i64, Option<i64>, bool) = tx.query_row(
        "SELECT status_id, closed_at,
                EXISTS(SELECT 1 FROM epics WHERE project_id = projects.id)
                OR EXISTS(SELECT 1 FROM macros WHERE project_id = projects.id)
         FROM projects WHERE id = ?1",
        [id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    )?;
    let slug = resolve_slug(&tx, input, name, Some(id))?;
    let status_id = if has_children {
        current_status_id
    } else {
        resolve_status(&tx, input)?
    };
    let closed_at = closed_at_for(&tx, status_id, current_closed_at)?;

    tx.execute(
        "UPDATE projects
         SET name = ?1, slug = ?2, status_id = ?3, updated_at = ?4, closed_at = ?5, deadline = ?6
         WHERE id = ?7",
        rusqlite::params![name, slug, status_id, super::now(), closed_at, input.deadline, id],
    )?;
    replace_repos(&tx, id, &input.repo_ids)?;
    tx.commit()?;

    Ok(get(conn, id)?)
}

fn required_name(input: &ProjectInput) -> Result<&str, SaveError> {
    let name = input.name.trim();
    if name.is_empty() {
        Err(SaveError::NameRequired)
    } else {
        Ok(name)
    }
}

fn resolve_slug(conn: &Connection, input: &ProjectInput, name: &str, id: Option<i64>) -> rusqlite::Result<String> {
    let source = match input.slug.trim() {
        "" => name,
        slug => slug,
    };
    unique_slug_excluding(conn, SlugTable::Projects, source, id)
}

fn resolve_status(conn: &Connection, input: &ProjectInput) -> rusqlite::Result<i64> {
    match input.status_id {
        Some(id) => Ok(id),
        None => statuses::id_by_name(conn, statuses::DEFAULT_STATUS),
    }
}

/// `closed_at` is filled when the status is Done or Canceled (keeping the original
/// date if it was already closed) and cleared otherwise.
fn closed_at_for(conn: &Connection, status_id: i64, current: Option<i64>) -> rusqlite::Result<Option<i64>> {
    if statuses::is_closing(conn, status_id)? {
        Ok(Some(current.unwrap_or_else(super::now)))
    } else {
        Ok(None)
    }
}

fn replace_repos(conn: &Connection, project_id: i64, repo_ids: &[i64]) -> rusqlite::Result<()> {
    conn.execute("DELETE FROM project_repos WHERE project_id = ?1", [project_id])?;
    let mut stmt = conn.prepare("INSERT OR IGNORE INTO project_repos (project_id, repo_id) VALUES (?1, ?2)")?;
    for repo_id in repo_ids {
        stmt.execute([project_id, *repo_id])?;
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{open_in_memory, repos};

    fn input(name: &str) -> ProjectInput {
        ProjectInput {
            name: name.to_string(),
            slug: String::new(),
            status_id: None,
            deadline: None,
            repo_ids: Vec::new(),
        }
    }

    #[test]
    fn creates_with_default_status_and_generated_slug() {
        let conn = open_in_memory();
        let project = create(&conn, &input("My Project")).unwrap();
        assert_eq!(project.slug, "my-project");
        assert_eq!(project.status_id, statuses::id_by_name(&conn, "Triage").unwrap());
        assert_eq!(project.closed_at, None);
    }

    #[test]
    fn rejects_empty_name() {
        let conn = open_in_memory();
        assert!(matches!(create(&conn, &input("   ")), Err(SaveError::NameRequired)));
    }

    #[test]
    fn uses_edited_slug_and_keeps_it_unique() {
        let conn = open_in_memory();
        create(&conn, &input("Other")).unwrap();
        let mut data = input("Avalon");
        data.slug = "Other".to_string();
        assert_eq!(create(&conn, &data).unwrap().slug, "other_2");
    }

    #[test]
    fn update_keeps_own_slug() {
        let conn = open_in_memory();
        let project = create(&conn, &input("Avalon")).unwrap();
        let mut data = input("Avalon");
        data.slug = project.slug.clone();
        assert_eq!(update(&conn, project.id, &data).unwrap().slug, "avalon");
    }

    #[test]
    fn closing_status_sets_and_clears_closed_at() {
        let conn = open_in_memory();
        let project = create(&conn, &input("Avalon")).unwrap();

        let mut data = input("Avalon");
        data.status_id = Some(statuses::id_by_name(&conn, "Done").unwrap());
        assert!(update(&conn, project.id, &data).unwrap().closed_at.is_some());

        data.status_id = Some(statuses::id_by_name(&conn, "Triage").unwrap());
        assert!(update(&conn, project.id, &data).unwrap().closed_at.is_none());
    }

    #[test]
    fn status_is_locked_when_project_has_children() {
        let conn = open_in_memory();
        let project = create(&conn, &input("Avalon")).unwrap();
        assert!(!project.has_children);

        conn.execute(
            "INSERT INTO epics (name, slug, status_id, created_at, updated_at, project_id)
             VALUES ('Epic', 'epic', ?1, 0, 0, ?2)",
            [project.status_id, project.id],
        )
        .unwrap();

        let mut data = input("Avalon renamed");
        data.status_id = Some(statuses::id_by_name(&conn, "Done").unwrap());
        let updated = update(&conn, project.id, &data).unwrap();
        assert!(updated.has_children);
        assert_eq!(updated.status_id, project.status_id);
        assert_eq!(updated.closed_at, None);
        assert_eq!(updated.name, "Avalon renamed");
    }

    #[test]
    fn replaces_repo_links_without_deleting_repos() {
        let conn = open_in_memory();
        let a = repos::create(&conn, "https://example.com/a.git", None).unwrap();
        let b = repos::create(&conn, "https://example.com/b.git", Some("C:/code/b")).unwrap();

        let mut data = input("Avalon");
        data.repo_ids = vec![a.id, b.id];
        let project = create(&conn, &data).unwrap();
        assert_eq!(project.repo_ids, vec![a.id, b.id]);

        data.repo_ids = vec![b.id];
        assert_eq!(update(&conn, project.id, &data).unwrap().repo_ids, vec![b.id]);
        assert_eq!(repos::list(&conn).unwrap().len(), 2);

        let catalog = list_catalog(&conn).unwrap();
        assert_eq!(catalog[0].repo_count, 1);
        assert_eq!(catalog[0].status_name, "Triage");
    }
}
