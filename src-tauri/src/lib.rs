mod commands;
mod db;
mod paths;

use std::sync::Mutex;

use commands::Database;
use paths::AppPaths;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let paths = AppPaths::resolve().expect("could not create the data folders next to the executable");
    let conn = db::open(&paths.database_file()).expect("could not open the database");

    tauri::Builder::default()
        .manage(Database(Mutex::new(conn)))
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::create_project
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Tauri application");
}
