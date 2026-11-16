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
pub fn unique_slug(conn: &Connection, table: SlugTable, name: &str) -> rusqlite::Result<String> {
    let mut base = slug::slugify(name);
    if base.is_empty() {
        base = FALLBACK_SLUG.to_string();
    }

    if !exists(conn, table, &base)? {
        return Ok(base);
    }

    let mut counter = 2;
    loop {
        let candidate = format!("{base}_{counter}");
        if !exists(conn, table, &candidate)? {
            return Ok(candidate);
        }
        counter += 1;
    }
}

fn exists(conn: &Connection, table: SlugTable, slug: &str) -> rusqlite::Result<bool> {
    let sql = format!("SELECT EXISTS(SELECT 1 FROM {} WHERE slug = ?1)", table.name());
    conn.query_row(&sql, [slug], |row| row.get(0))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{open_in_memory, projects};

    #[test]
    fn builds_slug_from_name() {
        let conn = open_in_memory();
        let slug = unique_slug(&conn, SlugTable::Projects, "Gestión de Tareas").unwrap();
        assert_eq!(slug, "gestion-de-tareas");
    }

    #[test]
    fn appends_repetition_counter() {
        let conn = open_in_memory();
        assert_eq!(projects::create(&conn, "Avalon").unwrap().slug, "avalon");
        assert_eq!(projects::create(&conn, "Avalon").unwrap().slug, "avalon_2");
        assert_eq!(projects::create(&conn, "avalon").unwrap().slug, "avalon_3");
    }

    #[test]
    fn falls_back_when_name_has_no_valid_chars() {
        let conn = open_in_memory();
        assert_eq!(unique_slug(&conn, SlugTable::Projects, "!!!").unwrap(), "item");
    }
}
