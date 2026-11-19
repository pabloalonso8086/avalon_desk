//! Tauri commands exposed to the frontend.
//!
//! Errors are returned as strings. Known business errors use a stable code
//! (e.g. `project_name_required`, `repo_url_exists`) that the frontend translates.

use std::path::Path;
use std::sync::Mutex;

use rusqlite::Connection;
use tauri::State;

use crate::db::items::{self, ProjectTree};
use crate::db::projects::{self, ProjectCatalogEntry, ProjectDetail, ProjectInput, ProjectMenuEntry};
use crate::db::repos::{self, Repo};
use crate::db::statuses::{self, Status};
use crate::settings::{AppSettings, PanelSize, Settings};

pub struct Database(pub Mutex<Connection>);

/// Error returned when creating a repo without URL.
const ERROR_REPO_URL_REQUIRED: &str = "repo_url_required";

fn to_message(error: impl std::fmt::Display) -> String {
    error.to_string()
}

/// Trims the text and turns an empty one into `None`.
fn optional_text(value: Option<String>) -> Option<String> {
    value.map(|v| v.trim().to_string()).filter(|v| !v.is_empty())
}

#[tauri::command]
pub fn list_projects(db: State<'_, Database>) -> Result<Vec<ProjectMenuEntry>, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::list_menu(&conn).map_err(to_message)
}

#[tauri::command]
pub fn list_project_catalog(db: State<'_, Database>) -> Result<Vec<ProjectCatalogEntry>, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::list_catalog(&conn).map_err(to_message)
}

#[tauri::command]
pub fn get_project(db: State<'_, Database>, id: i64) -> Result<ProjectDetail, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::get(&conn, id).map_err(to_message)
}

#[tauri::command]
pub fn create_project(db: State<'_, Database>, input: ProjectInput) -> Result<ProjectDetail, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::create(&conn, &input).map_err(to_message)
}

#[tauri::command]
pub fn update_project(db: State<'_, Database>, id: i64, input: ProjectInput) -> Result<ProjectDetail, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::update(&conn, id, &input).map_err(to_message)
}

/// Epics, macros and tasks of one project, for the ToDo view.
#[tauri::command]
pub fn get_project_tree(db: State<'_, Database>, project_id: i64) -> Result<ProjectTree, String> {
    let conn = db.0.lock().map_err(to_message)?;
    items::project_tree(&conn, project_id).map_err(to_message)
}

#[tauri::command]
pub fn list_statuses(db: State<'_, Database>) -> Result<Vec<Status>, String> {
    let conn = db.0.lock().map_err(to_message)?;
    statuses::list(&conn).map_err(to_message)
}

#[tauri::command]
pub fn list_repos(db: State<'_, Database>) -> Result<Vec<Repo>, String> {
    let conn = db.0.lock().map_err(to_message)?;
    repos::list(&conn).map_err(to_message)
}

#[tauri::command]
pub fn create_repo(db: State<'_, Database>, url: String, path: Option<String>) -> Result<Repo, String> {
    let url = url.trim();
    if url.is_empty() {
        return Err(ERROR_REPO_URL_REQUIRED.to_string());
    }
    let path = optional_text(path);
    let conn = db.0.lock().map_err(to_message)?;
    repos::create(&conn, url, path.as_deref()).map_err(to_message)
}

/// Changes the local path of a repo. It affects every project linked to it.
#[tauri::command]
pub fn update_repo_path(db: State<'_, Database>, id: i64, path: Option<String>) -> Result<(), String> {
    let path = optional_text(path);
    let conn = db.0.lock().map_err(to_message)?;
    repos::update_path(&conn, id, path.as_deref()).map_err(to_message)
}

/// Whether the path is an existing folder. Used to flag (not block) wrong repo paths.
#[tauri::command]
pub fn path_exists(path: String) -> bool {
    let path = path.trim();
    !path.is_empty() && Path::new(path).is_dir()
}

/// Settings from `settings.json`.
#[tauri::command]
pub fn get_settings(settings: State<'_, Settings>) -> AppSettings {
    settings.get()
}

/// Saves the sidebar width in `settings.json` (clamped to its limits).
#[tauri::command]
pub fn set_sidebar_width(settings: State<'_, Settings>, width: u32) -> Result<PanelSize, String> {
    settings.set_sidebar_width(width).map_err(to_message)
}

/// Saves the interface theme in `settings.json` and returns the stored one.
#[tauri::command]
pub fn set_theme(settings: State<'_, Settings>, theme: String) -> Result<String, String> {
    settings.set_theme(&theme).map_err(to_message)
}
