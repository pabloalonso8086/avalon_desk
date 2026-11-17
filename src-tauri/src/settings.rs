//! App settings stored in `settings.json`, next to the executable.
//!
//! The file can be edited by hand. On load, missing keys are filled with their
//! defaults and unknown keys are kept as they are. If the file is not valid JSON,
//! it is renamed to `settings.invalid.json` and a default one is created.

use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::sync::Mutex;

use serde::{Deserialize, Serialize};
use serde_json::{Map, Value};

pub const SETTINGS_FILE: &str = "settings.json";
const INVALID_SETTINGS_FILE: &str = "settings.invalid.json";

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct AppSettings {
    pub layout: LayoutSettings,
    /// Keys this version does not know. Kept so manual edits are never lost.
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

#[derive(Debug, Clone, Default, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct LayoutSettings {
    pub sidebar: PanelSize,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

/// Size of a resizable panel, in pixels.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(default)]
pub struct PanelSize {
    pub width: u32,
    /// Width restored by double-clicking the separator.
    pub default_width: u32,
    pub min_width: u32,
    pub max_width: u32,
    #[serde(flatten)]
    pub extra: Map<String, Value>,
}

impl Default for PanelSize {
    fn default() -> Self {
        Self {
            width: 240,
            default_width: 240,
            min_width: 180,
            max_width: 480,
            extra: Map::new(),
        }
    }
}

impl PanelSize {
    /// Keeps the limits coherent and every width inside them.
    fn normalize(&mut self) {
        if self.min_width > self.max_width {
            std::mem::swap(&mut self.min_width, &mut self.max_width);
        }
        self.default_width = self.clamp(self.default_width);
        self.width = self.clamp(self.width);
    }

    pub fn clamp(&self, width: u32) -> u32 {
        width.clamp(self.min_width, self.max_width)
    }
}

impl AppSettings {
    fn normalize(&mut self) {
        self.layout.sidebar.normalize();
    }
}

/// Settings loaded in memory plus the file they are saved to.
pub struct Settings {
    path: PathBuf,
    current: Mutex<AppSettings>,
}

impl Settings {
    /// Loads `settings.json` (creating or completing it) from `path`.
    pub fn load(path: PathBuf) -> io::Result<Self> {
        let settings = read_or_create(&path)?;
        Ok(Self {
            path,
            current: Mutex::new(settings),
        })
    }

    pub fn get(&self) -> AppSettings {
        self.lock().clone()
    }

    /// Saves the sidebar width (clamped to its limits) and returns the stored size.
    pub fn set_sidebar_width(&self, width: u32) -> io::Result<PanelSize> {
        let mut settings = self.lock();
        settings.layout.sidebar.width = settings.layout.sidebar.clamp(width);
        write(&self.path, &settings)?;
        Ok(settings.layout.sidebar.clone())
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, AppSettings> {
        // A poisoned lock only means a panic while holding it; the data is still usable.
        self.current.lock().unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}

fn read_or_create(path: &Path) -> io::Result<AppSettings> {
    let original = match fs::read_to_string(path) {
        Ok(text) => Some(text),
        Err(error) if error.kind() == io::ErrorKind::NotFound => None,
        Err(error) => return Err(error),
    };

    let mut settings = match original.as_deref().map(serde_json::from_str::<AppSettings>) {
        Some(Ok(settings)) => settings,
        Some(Err(_)) => {
            fs::rename(path, path.with_file_name(INVALID_SETTINGS_FILE))?;
            AppSettings::default()
        }
        None => AppSettings::default(),
    };
    settings.normalize();

    // Rewrite only when something changed (new file, missing keys, fixed values).
    let unchanged = original
        .as_deref()
        .and_then(|text| serde_json::from_str::<Value>(text).ok())
        .is_some_and(|value| serde_json::to_value(&settings).ok() == Some(value));
    if !unchanged {
        write(path, &settings)?;
    }
    Ok(settings)
}

fn write(path: &Path, settings: &AppSettings) -> io::Result<()> {
    let text = serde_json::to_string_pretty(settings).map_err(io::Error::other)?;
    fs::write(path, text + "\n")
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Empty temporary folder, unique per test.
    fn temp_dir(name: &str) -> PathBuf {
        let dir = std::env::temp_dir().join(format!("avalon-settings-{name}-{}", std::process::id()));
        let _ = fs::remove_dir_all(&dir);
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn creates_file_with_defaults() {
        let path = temp_dir("create").join(SETTINGS_FILE);
        let settings = Settings::load(path.clone()).unwrap().get();
        assert_eq!(settings, AppSettings::default());
        assert!(path.exists());
    }

    #[test]
    fn fills_missing_keys_and_keeps_unknown_ones() {
        let path = temp_dir("partial").join(SETTINGS_FILE);
        fs::write(&path, r#"{"language":"es","layout":{"sidebar":{"width":300}}}"#).unwrap();

        let settings = Settings::load(path.clone()).unwrap().get();
        assert_eq!(settings.layout.sidebar.width, 300);
        assert_eq!(settings.layout.sidebar.default_width, 240);

        let saved: Value = serde_json::from_str(&fs::read_to_string(&path).unwrap()).unwrap();
        assert_eq!(saved["language"], "es");
        assert_eq!(saved["layout"]["sidebar"]["max_width"], 480);
    }

    #[test]
    fn clamps_widths_to_limits() {
        let path = temp_dir("clamp").join(SETTINGS_FILE);
        fs::write(&path, r#"{"layout":{"sidebar":{"width":5000,"min_width":400,"max_width":200}}}"#).unwrap();

        let settings = Settings::load(path).unwrap();
        let sidebar = settings.get().layout.sidebar;
        assert_eq!((sidebar.min_width, sidebar.max_width), (200, 400));
        assert_eq!(sidebar.width, 400);
        assert_eq!(settings.set_sidebar_width(10).unwrap().width, 200);
    }

    #[test]
    fn replaces_invalid_file() {
        let dir = temp_dir("invalid");
        let path = dir.join(SETTINGS_FILE);
        fs::write(&path, "{ not json").unwrap();

        let settings = Settings::load(path).unwrap().get();
        assert_eq!(settings, AppSettings::default());
        assert!(dir.join(INVALID_SETTINGS_FILE).exists());
    }
}
