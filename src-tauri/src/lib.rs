mod commands;
mod db;
mod paths;
mod settings;

use std::sync::Mutex;

use commands::Database;
use paths::AppPaths;
use settings::Settings;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let paths = AppPaths::resolve().expect("could not create the data folders next to the executable");
    let conn = db::open(&paths.database_file()).expect("could not open the database");
    let settings = Settings::load(paths.settings_file()).expect("could not load settings.json");

    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .manage(Database(Mutex::new(conn)))
        .manage(settings)
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::list_project_catalog,
            commands::get_project,
            commands::create_project,
            commands::update_project,
            commands::get_project_tree,
            commands::list_statuses,
            commands::list_repos,
            commands::create_repo,
            commands::update_repo_path,
            commands::path_exists,
            commands::get_settings,
            commands::set_sidebar_width,
            commands::set_theme
        ])
        .run(tauri::generate_context!())
        .expect("error while running the Tauri application");
}
