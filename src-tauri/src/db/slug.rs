//! Public ids (slugs) built from the item's name.
//!
//! "My Project" -> "my-project". If it already exists in the table, a repetition
//! counter is appended: "my-project_2", "my-project_3", ...

use rusqlite::Connection;

/// Tables that have a `slug` column. Using an enum avoids building SQL from free text.
#[derive(Clone, Copy)]
#[allow(dead_code)]
pub enum SlugTable {
    Projects,
    Epics,
    Macros,
    Tasks,
}

impl SlugTable {
    fn name(self) -> &'static str {
        match self {
            Self::Projects => "projects",
            Self::Epics => "epics",
            Self::Macros => "macros",
            Self::Tasks => "tasks",
        }
    }
}

const FALLBACK_SLUG: &str = "item";

/// Returns a slug for `name` that is not yet used in `table`.
#[allow(dead_code)]
pub fn unique_slug(conn: &Connection, table: SlugTable, name: &str) -> rusqlite::Result<String> {
    unique_slug_excluding(conn, table, name, None)
}

/// Like [`unique_slug`], but ignores the row `exclude_id`, so an item being edited
/// can keep its own slug.
pub fn unique_slug_excluding(
    conn: &Connection,
    table: SlugTable,
    source: &str,
    exclude_id: Option<i64>,
) -> rusqlite::Result<String> {
    let mut base = slug::slugify(source);
    if base.is_empty() {
        base = FALLBACK_SLUG.to_string();
    }

    if !exists(conn, table, &base, exclude_id)? {
        return Ok(base);
    }

    let mut counter = 2;
    loop {
        let candidate = format!("{base}_{counter}");
        if !exists(conn, table, &candidate, exclude_id)? {
            return Ok(candidate);
        }
        counter += 1;
    }
}

fn exists(conn: &Connection, table: SlugTable, slug: &str, exclude_id: Option<i64>) -> rusqlite::Result<bool> {
    let sql = format!(
        "SELECT EXISTS(SELECT 1 FROM {} WHERE slug = ?1 AND (?2 IS NULL OR id <> ?2))",
        table.name()
    );
    conn.query_row(&sql, rusqlite::params![slug, exclude_id], |row| row.get(0))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::open_in_memory;
    use crate::db::projects::{self, ProjectInput};

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
    fn builds_slug_from_name() {
        let conn = open_in_memory();
        let slug = unique_slug(&conn, SlugTable::Projects, "Gestión de Tareas").unwrap();
        assert_eq!(slug, "gestion-de-tareas");
    }

    #[test]
    fn appends_repetition_counter() {
        let conn = open_in_memory();
        assert_eq!(projects::create(&conn, &input("Avalon")).unwrap().slug, "avalon");
        assert_eq!(projects::create(&conn, &input("Avalon")).unwrap().slug, "avalon_2");
        assert_eq!(projects::create(&conn, &input("avalon")).unwrap().slug, "avalon_3");
    }

    #[test]
    fn excluded_row_keeps_its_own_slug() {
        let conn = open_in_memory();
        let project = projects::create(&conn, &input("Avalon")).unwrap();
        let slug = unique_slug_excluding(&conn, SlugTable::Projects, "Avalon", Some(project.id)).unwrap();
        assert_eq!(slug, "avalon");
    }

    #[test]
    fn falls_back_when_name_has_no_valid_chars() {
        let conn = open_in_memory();
        assert_eq!(unique_slug(&conn, SlugTable::Projects, "!!!").unwrap(), "item");
    }
}
