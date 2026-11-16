//! Tauri commands exposed to the frontend.

use std::sync::Mutex;

use rusqlite::Connection;
use tauri::State;

use crate::db::projects::{self, Project, ProjectMenuEntry};

pub struct Database(pub Mutex<Connection>);

fn to_message(error: impl std::fmt::Display) -> String {
    error.to_string()
}

#[tauri::command]
pub fn list_projects(db: State<'_, Database>) -> Result<Vec<ProjectMenuEntry>, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::list_menu(&conn).map_err(to_message)
}

#[tauri::command]
pub fn create_project(db: State<'_, Database>, name: String) -> Result<Project, String> {
    let conn = db.0.lock().map_err(to_message)?;
    projects::create(&conn, name.trim()).map_err(to_message)
}
