//! Data folders, located next to the executable.
//!
//! - `bbdd`:  SQLite database.
//! - `notes`: Markdown files.
//! - `docs`:  reserved for future external attachments (not created yet).

use std::io;
use std::path::PathBuf;

pub const DATABASE_DIR: &str = "bbdd";
pub const NOTES_DIR: &str = "notes";
#[allow(dead_code)]
pub const DOCS_DIR: &str = "docs";
pub const DATABASE_FILE: &str = "avalon.db";

pub struct AppPaths {
    /// Folder of the executable.
    pub root: PathBuf,
    pub database_dir: PathBuf,
    pub notes_dir: PathBuf,
}

impl AppPaths {
    /// Resolves the folders next to the executable and creates them if missing.
    pub fn resolve() -> io::Result<Self> {
        let exe = std::env::current_exe()?;
        let root = exe
            .parent()
            .ok_or_else(|| io::Error::new(io::ErrorKind::NotFound, "executable has no parent dir"))?
            .to_path_buf();

        let paths = Self {
            root: root.clone(),
            database_dir: root.join(DATABASE_DIR),
            notes_dir: root.join(NOTES_DIR),
        };
        std::fs::create_dir_all(&paths.database_dir)?;
        std::fs::create_dir_all(&paths.notes_dir)?;
        Ok(paths)
    }

    pub fn database_file(&self) -> PathBuf {
        self.database_dir.join(DATABASE_FILE)
    }

    /// `settings.json`, next to the executable.
    pub fn settings_file(&self) -> PathBuf {
        self.root.join(crate::settings::SETTINGS_FILE)
    }
}
