mod bindings;
mod utils;

use regex::Regex;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use specta::Type;
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::menu::{MenuBuilder, MenuItemBuilder, PredefinedMenuItem, SubmenuBuilder};
#[cfg(not(target_os = "macos"))]
use tauri::webview::WebviewWindowBuilder;
use tauri::{AppHandle, Emitter, Manager, WebviewUrl};

// macOS-only: NSPanel for native panel behavior
#[cfg(target_os = "macos")]
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelBuilder, PanelLevel, StyleMask,
};

// macOS-only: For tracking and reactivating previous app when dismissing quick pane
#[cfg(target_os = "macos")]
use std::sync::atomic::{AtomicI32, Ordering};

#[cfg(target_os = "macos")]
static PREVIOUS_APP_PID: AtomicI32 = AtomicI32::new(-1);

// Define custom panel class for quick pane (macOS only)
#[cfg(target_os = "macos")]
tauri_panel! {
    panel!(QuickPanePanel {
        config: {
            can_become_key_window: true,
            can_become_main_window: false,
            is_floating_panel: true
        }
    })
}

/// Error types for recovery operations (typed for frontend matching)
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum RecoveryError {
    /// File does not exist (expected case, not a failure)
    FileNotFound,
    /// Filename validation failed
    ValidationError { message: String },
    /// Data exceeds size limit
    DataTooLarge { max_bytes: u32 },
    /// File system read/write error
    IoError { message: String },
    /// JSON serialization/deserialization error
    ParseError { message: String },
}

impl std::fmt::Display for RecoveryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            RecoveryError::FileNotFound => write!(f, "File not found"),
            RecoveryError::ValidationError { message } => write!(f, "Validation error: {message}"),
            RecoveryError::DataTooLarge { max_bytes } => {
                write!(f, "Data too large (max {max_bytes} bytes)")
            }
            RecoveryError::IoError { message } => write!(f, "IO error: {message}"),
            RecoveryError::ParseError { message } => write!(f, "Parse error: {message}"),
        }
    }
}

// Validation functions
fn validate_filename(filename: &str) -> Result<(), String> {
    // Regex pattern: only alphanumeric, dash, underscore, dot
    let filename_pattern = Regex::new(r"^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9]+)?$")
        .map_err(|e| format!("Regex compilation error: {e}"))?;

    if filename.is_empty() {
        return Err("Filename cannot be empty".to_string());
    }

    if filename.len() > 100 {
        return Err("Filename too long (max 100 characters)".to_string());
    }

    if !filename_pattern.is_match(filename) {
        return Err(
            "Invalid filename: only alphanumeric characters, dashes, underscores, and dots allowed"
                .to_string(),
        );
    }

    Ok(())
}

fn validate_string_input(input: &str, max_len: usize, field_name: &str) -> Result<(), String> {
    if input.len() > max_len {
        return Err(format!("{field_name} too long (max {max_len} characters)"));
    }
    Ok(())
}

fn validate_theme(theme: &str) -> Result<(), String> {
    match theme {
        "light" | "dark" | "system" => Ok(()),
        _ => Err("Invalid theme: must be 'light', 'dark', or 'system'".to_string()),
    }
}

// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
#[tauri::command]
#[specta::specta]
fn greet(name: &str) -> String {
    // Input validation
    if let Err(e) = validate_string_input(name, 100, "Name") {
        log::warn!("Invalid greet input: {e}");
        return format!("Error: {e}");
    }

    log::info!("Greeting user: {name}");
    format!("Hello, {name}! You've been greeted from Rust!")
}

// Preferences data structure
// Only contains settings that should be persisted to disk
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppPreferences {
    pub theme: String,
    // Add new persistent preferences here, e.g.:
    // pub auto_save: bool,
    // pub language: String,
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
            // Add defaults for new preferences here
        }
    }
}

fn get_preferences_path(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    // Ensure the directory exists
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {e}"))?;

    Ok(app_data_dir.join("preferences.json"))
}

#[tauri::command]
#[specta::specta]
async fn load_preferences(app: AppHandle) -> Result<AppPreferences, String> {
    log::debug!("Loading preferences from disk");
    let prefs_path = get_preferences_path(&app)?;

    if !prefs_path.exists() {
        log::info!("Preferences file not found, using defaults");
        return Ok(AppPreferences::default());
    }

    let contents = std::fs::read_to_string(&prefs_path).map_err(|e| {
        log::error!("Failed to read preferences file: {e}");
        format!("Failed to read preferences file: {e}")
    })?;

    let preferences: AppPreferences = serde_json::from_str(&contents).map_err(|e| {
        log::error!("Failed to parse preferences JSON: {e}");
        format!("Failed to parse preferences: {e}")
    })?;

    log::info!("Successfully loaded preferences");
    Ok(preferences)
}

#[tauri::command]
#[specta::specta]
async fn save_preferences(app: AppHandle, preferences: AppPreferences) -> Result<(), String> {
    // Validate theme value
    validate_theme(&preferences.theme)?;

    log::debug!("Saving preferences to disk: {preferences:?}");
    let prefs_path = get_preferences_path(&app)?;

    let json_content = serde_json::to_string_pretty(&preferences).map_err(|e| {
        log::error!("Failed to serialize preferences: {e}");
        format!("Failed to serialize preferences: {e}")
    })?;

    // Write to a temporary file first, then rename (atomic operation)
    let temp_path = prefs_path.with_extension("tmp");

    std::fs::write(&temp_path, json_content).map_err(|e| {
        log::error!("Failed to write preferences file: {e}");
        format!("Failed to write preferences file: {e}")
    })?;

    std::fs::rename(&temp_path, &prefs_path).map_err(|e| {
        log::error!("Failed to finalize preferences file: {e}");
        format!("Failed to finalize preferences file: {e}")
    })?;

    log::info!("Successfully saved preferences to {prefs_path:?}");
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn send_native_notification(
    app: AppHandle,
    title: String,
    body: Option<String>,
) -> Result<(), String> {
    log::info!("Sending native notification: {title}");

    #[cfg(not(mobile))]
    {
        use tauri_plugin_notification::NotificationExt;

        let mut notification = app.notification().builder().title(title);

        if let Some(body_text) = body {
            notification = notification.body(body_text);
        }

        match notification.show() {
            Ok(_) => {
                log::info!("Native notification sent successfully");
                Ok(())
            }
            Err(e) => {
                log::error!("Failed to send native notification: {e}");
                Err(format!("Failed to send notification: {e}"))
            }
        }
    }

    #[cfg(mobile)]
    {
        log::warn!("Native notifications not supported on mobile");
        Err("Native notifications not supported on mobile".to_string())
    }
}

// Recovery functions - simple pattern for saving JSON data to disk
fn get_recovery_dir(app: &AppHandle) -> Result<PathBuf, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {e}"))?;

    let recovery_dir = app_data_dir.join("recovery");

    // Ensure the recovery directory exists
    std::fs::create_dir_all(&recovery_dir)
        .map_err(|e| format!("Failed to create recovery directory: {e}"))?;

    Ok(recovery_dir)
}

const MAX_RECOVERY_DATA_BYTES: usize = 10_485_760; // 10MB

#[tauri::command]
#[specta::specta]
async fn save_emergency_data(
    app: AppHandle,
    filename: String,
    data: Value,
) -> Result<(), RecoveryError> {
    log::info!("Saving emergency data to file: {filename}");

    // Validate filename with proper security checks
    validate_filename(&filename).map_err(|e| RecoveryError::ValidationError { message: e })?;

    // Validate data size (10MB limit)
    let data_str = serde_json::to_string(&data).map_err(|e| RecoveryError::ParseError {
        message: e.to_string(),
    })?;
    if data_str.len() > MAX_RECOVERY_DATA_BYTES {
        return Err(RecoveryError::DataTooLarge {
            max_bytes: MAX_RECOVERY_DATA_BYTES as u32,
        });
    }

    let recovery_dir = get_recovery_dir(&app).map_err(|e| RecoveryError::IoError { message: e })?;
    let file_path = recovery_dir.join(format!("{filename}.json"));

    let json_content = serde_json::to_string_pretty(&data).map_err(|e| {
        log::error!("Failed to serialize emergency data: {e}");
        RecoveryError::ParseError {
            message: e.to_string(),
        }
    })?;

    // Write to a temporary file first, then rename (atomic operation)
    let temp_path = file_path.with_extension("tmp");

    std::fs::write(&temp_path, json_content).map_err(|e| {
        log::error!("Failed to write emergency data file: {e}");
        RecoveryError::IoError {
            message: e.to_string(),
        }
    })?;

    std::fs::rename(&temp_path, &file_path).map_err(|e| {
        log::error!("Failed to finalize emergency data file: {e}");
        RecoveryError::IoError {
            message: e.to_string(),
        }
    })?;

    log::info!("Successfully saved emergency data to {file_path:?}");
    Ok(())
}

#[tauri::command]
#[specta::specta]
async fn load_emergency_data(app: AppHandle, filename: String) -> Result<Value, RecoveryError> {
    log::info!("Loading emergency data from file: {filename}");

    // Validate filename with proper security checks
    validate_filename(&filename).map_err(|e| RecoveryError::ValidationError { message: e })?;

    let recovery_dir = get_recovery_dir(&app).map_err(|e| RecoveryError::IoError { message: e })?;
    let file_path = recovery_dir.join(format!("{filename}.json"));

    if !file_path.exists() {
        log::info!("Recovery file not found: {file_path:?}");
        return Err(RecoveryError::FileNotFound);
    }

    let contents = std::fs::read_to_string(&file_path).map_err(|e| {
        log::error!("Failed to read recovery file: {e}");
        RecoveryError::IoError {
            message: e.to_string(),
        }
    })?;

    let data: Value = serde_json::from_str(&contents).map_err(|e| {
        log::error!("Failed to parse recovery JSON: {e}");
        RecoveryError::ParseError {
            message: e.to_string(),
        }
    })?;

    log::info!("Successfully loaded emergency data");
    Ok(data)
}

#[tauri::command]
#[specta::specta]
async fn cleanup_old_recovery_files(app: AppHandle) -> Result<u32, RecoveryError> {
    log::info!("Cleaning up old recovery files");

    let recovery_dir = get_recovery_dir(&app).map_err(|e| RecoveryError::IoError { message: e })?;
    let mut removed_count = 0;

    // Calculate cutoff time (7 days ago)
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| RecoveryError::IoError {
            message: e.to_string(),
        })?
        .as_secs();
    let seven_days_ago = now - (7 * 24 * 60 * 60);

    // Read directory and check each file
    let entries = std::fs::read_dir(&recovery_dir).map_err(|e| {
        log::error!("Failed to read recovery directory: {e}");
        RecoveryError::IoError {
            message: e.to_string(),
        }
    })?;

    for entry in entries {
        let entry = match entry {
            Ok(e) => e,
            Err(e) => {
                log::warn!("Failed to read directory entry: {e}");
                continue;
            }
        };

        let path = entry.path();

        // Only process JSON files
        if path.extension().is_none_or(|ext| ext != "json") {
            continue;
        }

        // Check file modification time
        let metadata = match std::fs::metadata(&path) {
            Ok(m) => m,
            Err(e) => {
                log::warn!("Failed to get file metadata: {e}");
                continue;
            }
        };

        let modified = match metadata.modified() {
            Ok(m) => m,
            Err(e) => {
                log::warn!("Failed to get file modification time: {e}");
                continue;
            }
        };

        let modified_secs = match modified.duration_since(UNIX_EPOCH) {
            Ok(d) => d.as_secs(),
            Err(e) => {
                log::warn!("Failed to convert modification time: {e}");
                continue;
            }
        };

        // Remove if older than 7 days
        if modified_secs < seven_days_ago {
            match std::fs::remove_file(&path) {
                Ok(_) => {
                    log::info!("Removed old recovery file: {path:?}");
                    removed_count += 1;
                }
                Err(e) => {
                    log::warn!("Failed to remove old recovery file: {e}");
                }
            }
        }
    }

    log::info!("Cleanup complete. Removed {removed_count} old recovery files");
    Ok(removed_count)
}

// Quick Pane Window Management
// The quick pane is created once at app startup (hidden) and then shown/hidden via commands.
// This is required because NSPanel creation must happen on the main thread.
const QUICK_PANE_LABEL: &str = "quick-pane";

/// Creates the quick pane window at app startup.
/// Must be called from the main thread (e.g., in setup()).
/// The window starts hidden and is shown via show_quick_pane command.
pub fn init_quick_pane(app: &AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        init_quick_pane_macos(app)
    }

    #[cfg(not(target_os = "macos"))]
    {
        init_quick_pane_standard(app)
    }
}

/// Creates the quick pane as an NSPanel on macOS (hidden).
#[cfg(target_os = "macos")]
fn init_quick_pane_macos(app: &AppHandle) -> Result<(), String> {
    use tauri::{LogicalSize, Size};

    log::debug!("Creating quick pane as NSPanel (macOS)");

    let panel = PanelBuilder::<_, QuickPanePanel>::new(app, QUICK_PANE_LABEL)
        .url(WebviewUrl::App("quick-pane.html".into()))
        .title("Quick Entry")
        .size(Size::Logical(LogicalSize::new(500.0, 72.0)))
        .level(PanelLevel::Status) // Status level to appear above fullscreen apps
        .transparent(true)
        .has_shadow(true)
        .collection_behavior(
            CollectionBehavior::new()
                .full_screen_auxiliary()
                .can_join_all_spaces(),
        )
        .style_mask(StyleMask::empty().nonactivating_panel())
        .hides_on_deactivate(false)
        .works_when_modal(true)
        .with_window(|w| {
            w.decorations(false)
                .skip_taskbar(true)
                .resizable(false)
                .center()
        })
        .build()
        .map_err(|e| format!("Failed to create quick pane panel: {e}"))?;

    // Start hidden - will be shown via show_quick_pane command
    panel.hide();
    log::info!("Quick pane NSPanel created (hidden)");
    Ok(())
}

/// Creates the quick pane as a standard Tauri window (hidden) on non-macOS platforms.
#[cfg(not(target_os = "macos"))]
fn init_quick_pane_standard(app: &AppHandle) -> Result<(), String> {
    log::debug!("Creating quick pane as standard window");

    WebviewWindowBuilder::new(
        app,
        QUICK_PANE_LABEL,
        WebviewUrl::App("quick-pane.html".into()),
    )
    .title("Quick Entry")
    .inner_size(500.0, 72.0)
    .always_on_top(true)
    .skip_taskbar(true)
    .decorations(false)
    .transparent(true)
    .visible(false) // Start hidden
    .resizable(false)
    .center()
    .build()
    .map_err(|e| format!("Failed to create quick pane window: {e}"))?;

    log::info!("Quick pane window created (hidden)");
    Ok(())
}

/// Shows the quick pane window.
/// On macOS, captures the frontmost app before showing so we can reactivate it on dismiss.
/// Must be sync (not async) to run on main thread for Cocoa API calls.
#[tauri::command]
#[specta::specta]
fn show_quick_pane(app: AppHandle) -> Result<(), String> {
    log::info!("Showing quick pane window");

    // macOS: Capture the frontmost app before we show our panel
    #[cfg(target_os = "macos")]
    {
        use objc2_app_kit::NSWorkspace;

        let workspace = unsafe { NSWorkspace::sharedWorkspace() };
        if let Some(frontmost) = unsafe { workspace.frontmostApplication() } {
            let pid = unsafe { frontmost.processIdentifier() };
            PREVIOUS_APP_PID.store(pid, Ordering::SeqCst);
            log::debug!("Captured previous app PID: {pid}");
        }
    }

    let window = app.get_webview_window(QUICK_PANE_LABEL).ok_or_else(|| {
        "Quick pane window not found - was init_quick_pane called at startup?".to_string()
    })?;

    window
        .show()
        .map_err(|e| format!("Failed to show window: {e}"))?;
    window
        .set_focus()
        .map_err(|e| format!("Failed to focus window: {e}"))?;

    log::debug!("Quick pane window shown");
    Ok(())
}

/// Hides the quick pane window.
#[tauri::command]
#[specta::specta]
async fn hide_quick_pane(app: AppHandle) -> Result<(), String> {
    log::info!("Hiding quick pane window");

    if let Some(window) = app.get_webview_window(QUICK_PANE_LABEL) {
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {e}"))?;
        log::debug!("Quick pane window hidden");
    } else {
        log::debug!("Quick pane window not found (already hidden or not created)");
    }

    Ok(())
}

/// Dismisses the quick pane and reactivates the previously active app.
/// On macOS, reactivates the app that was frontmost before we showed the panel.
/// Must be sync (not async) to run on main thread for Cocoa API calls.
/// On other platforms, falls back to standard hide().
#[tauri::command]
#[specta::specta]
fn dismiss_quick_pane(app: AppHandle) -> Result<(), String> {
    log::info!("Dismissing quick pane window");

    // Hide the panel first
    if let Some(window) = app.get_webview_window(QUICK_PANE_LABEL) {
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {e}"))?;
        log::debug!("Quick pane window hidden");
    } else {
        log::debug!("Quick pane window not found");
    }

    // macOS: Reactivate the previously frontmost app
    #[cfg(target_os = "macos")]
    {
        use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};

        let pid = PREVIOUS_APP_PID.swap(-1, Ordering::SeqCst);
        if pid > 0 {
            if let Some(running_app) =
                unsafe { NSRunningApplication::runningApplicationWithProcessIdentifier(pid) }
            {
                let activated = unsafe {
                    running_app.activateWithOptions(NSApplicationActivationOptions::empty())
                };
                log::debug!("Reactivated previous app (PID: {pid}): {activated}");
            } else {
                log::debug!("Previous app (PID: {pid}) no longer running");
            }
        }
    }

    Ok(())
}

/// Toggles the quick pane window visibility.
/// On macOS, captures/reactivates the previous app appropriately.
/// Must be sync (not async) to run on main thread for Cocoa API calls.
#[tauri::command]
#[specta::specta]
fn toggle_quick_pane(app: AppHandle) -> Result<(), String> {
    log::info!("Toggling quick pane window");

    let window = app.get_webview_window(QUICK_PANE_LABEL).ok_or_else(|| {
        "Quick pane window not found - was init_quick_pane called at startup?".to_string()
    })?;

    let is_visible = window
        .is_visible()
        .map_err(|e| format!("Failed to check visibility: {e}"))?;

    if is_visible {
        // Hiding: use dismiss logic which reactivates previous app
        window
            .hide()
            .map_err(|e| format!("Failed to hide window: {e}"))?;
        log::debug!("Quick pane window hidden");

        // macOS: Reactivate the previously frontmost app
        #[cfg(target_os = "macos")]
        {
            use objc2_app_kit::{NSApplicationActivationOptions, NSRunningApplication};

            let pid = PREVIOUS_APP_PID.swap(-1, Ordering::SeqCst);
            if pid > 0 {
                if let Some(running_app) =
                    unsafe { NSRunningApplication::runningApplicationWithProcessIdentifier(pid) }
                {
                    let activated = unsafe {
                        running_app.activateWithOptions(NSApplicationActivationOptions::empty())
                    };
                    log::debug!("Reactivated previous app (PID: {pid}): {activated}");
                }
            }
        }
    } else {
        // Showing: capture previous app first
        #[cfg(target_os = "macos")]
        {
            use objc2_app_kit::NSWorkspace;

            let workspace = unsafe { NSWorkspace::sharedWorkspace() };
            if let Some(frontmost) = unsafe { workspace.frontmostApplication() } {
                let pid = unsafe { frontmost.processIdentifier() };
                PREVIOUS_APP_PID.store(pid, Ordering::SeqCst);
                log::debug!("Captured previous app PID: {pid}");
            }
        }

        window
            .show()
            .map_err(|e| format!("Failed to show window: {e}"))?;
        window
            .set_focus()
            .map_err(|e| format!("Failed to focus window: {e}"))?;
        log::debug!("Quick pane window shown");
    }

    Ok(())
}

// Create the native menu system
fn create_app_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    log::info!("Setting up native menu system");

    // Build the main application submenu
    let app_submenu = SubmenuBuilder::new(app, "Tauri Template")
        .item(&MenuItemBuilder::with_id("about", "About Tauri Template").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("check-updates", "Check for Updates...").build(app)?)
        .separator()
        .item(
            &MenuItemBuilder::with_id("preferences", "Preferences...")
                .accelerator("CmdOrCtrl+,")
                .build(app)?,
        )
        .separator()
        .item(&PredefinedMenuItem::hide(app, Some("Hide Tauri Template"))?)
        .item(&PredefinedMenuItem::hide_others(app, None)?)
        .item(&PredefinedMenuItem::show_all(app, None)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some("Quit Tauri Template"))?)
        .build()?;

    // Build the View submenu
    let view_submenu = SubmenuBuilder::new(app, "View")
        .item(
            &MenuItemBuilder::with_id("toggle-left-sidebar", "Toggle Left Sidebar")
                .accelerator("CmdOrCtrl+1")
                .build(app)?,
        )
        .item(
            &MenuItemBuilder::with_id("toggle-right-sidebar", "Toggle Right Sidebar")
                .accelerator("CmdOrCtrl+2")
                .build(app)?,
        )
        .build()?;

    // Build the main menu with submenus
    let menu = MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&view_submenu)
        .build()?;

    // Set the menu for the app
    app.set_menu(menu)?;

    log::info!("Native menu system initialized successfully");
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = bindings::generate_bindings();

    // Export TypeScript bindings in debug builds
    #[cfg(debug_assertions)]
    bindings::export_ts_bindings();

    // Build with common plugins
    let mut app_builder = tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                // Use Debug level in development, Info in production
                .level(if cfg!(debug_assertions) {
                    log::LevelFilter::Debug
                } else {
                    log::LevelFilter::Info
                })
                .targets([
                    // Always log to stdout for development
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    // Log to webview console for development
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                    // Log to system logs on macOS (appears in Console.app)
                    #[cfg(target_os = "macos")]
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: None,
                    }),
                ])
                .build(),
        );

    // macOS: Add NSPanel plugin for native panel behavior
    #[cfg(target_os = "macos")]
    {
        app_builder = app_builder.plugin(tauri_nspanel::init());
    }

    app_builder
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_os::init())
        .setup(|app| {
            log::info!("🚀 Application starting up");
            log::debug!(
                "App handle initialized for package: {}",
                app.package_info().name
            );

            // Set up global shortcut for quick pane
            #[cfg(desktop)]
            {
                use tauri_plugin_global_shortcut::{Builder, Code, Modifiers, ShortcutState};

                let app_handle = app.handle().clone();
                app.handle().plugin(
                    Builder::new()
                        .with_shortcut("CommandOrControl+Shift+.")?
                        .with_handler(move |_app, shortcut, event| {
                            if event.state == ShortcutState::Pressed
                                && (shortcut
                                    .matches(Modifiers::CONTROL | Modifiers::SHIFT, Code::Period)
                                    || shortcut
                                        .matches(Modifiers::SUPER | Modifiers::SHIFT, Code::Period))
                            {
                                log::info!("Quick pane shortcut triggered");
                                // Call directly - handler runs on main thread, toggle_quick_pane is sync
                                if let Err(e) = toggle_quick_pane(app_handle.clone()) {
                                    log::error!("Failed to toggle quick pane: {e}");
                                }
                            }
                        })
                        .build(),
                )?;
                log::info!("Global shortcut registered: Cmd/Ctrl+Shift+.");
            }

            // Create the quick pane window (hidden) - must be done on main thread
            if let Err(e) = init_quick_pane(app.handle()) {
                log::error!("Failed to create quick pane: {e}");
                // Non-fatal: app can still run without quick pane
            }

            // Set up native menu system
            if let Err(e) = create_app_menu(app) {
                log::error!("Failed to create app menu: {e}");
                return Err(e);
            }

            // Set up menu event handlers
            app.on_menu_event(move |app, event| {
                log::debug!("Menu event received: {:?}", event.id());

                match event.id().as_ref() {
                    "about" => {
                        log::info!("About menu item clicked");
                        // Emit event to React for handling
                        match app.emit("menu-about", ()) {
                            Ok(_) => log::debug!("Successfully emitted menu-about event"),
                            Err(e) => log::error!("Failed to emit menu-about event: {e}"),
                        }
                    }
                    "check-updates" => {
                        log::info!("Check for Updates menu item clicked");
                        // Emit event to React for handling
                        match app.emit("menu-check-updates", ()) {
                            Ok(_) => log::debug!("Successfully emitted menu-check-updates event"),
                            Err(e) => log::error!("Failed to emit menu-check-updates event: {e}"),
                        }
                    }
                    "preferences" => {
                        log::info!("Preferences menu item clicked");
                        // Emit event to React for handling
                        match app.emit("menu-preferences", ()) {
                            Ok(_) => log::debug!("Successfully emitted menu-preferences event"),
                            Err(e) => log::error!("Failed to emit menu-preferences event: {e}"),
                        }
                    }
                    "toggle-left-sidebar" => {
                        log::info!("Toggle Left Sidebar menu item clicked");
                        // Emit event to React for handling
                        match app.emit("menu-toggle-left-sidebar", ()) {
                            Ok(_) => {
                                log::debug!("Successfully emitted menu-toggle-left-sidebar event")
                            }
                            Err(e) => {
                                log::error!("Failed to emit menu-toggle-left-sidebar event: {e}")
                            }
                        }
                    }
                    "toggle-right-sidebar" => {
                        log::info!("Toggle Right Sidebar menu item clicked");
                        // Emit event to React for handling
                        match app.emit("menu-toggle-right-sidebar", ()) {
                            Ok(_) => {
                                log::debug!("Successfully emitted menu-toggle-right-sidebar event")
                            }
                            Err(e) => {
                                log::error!("Failed to emit menu-toggle-right-sidebar event: {e}")
                            }
                        }
                    }
                    _ => {
                        log::debug!("Unhandled menu event: {:?}", event.id());
                    }
                }
            });

            // Example of different log levels
            log::trace!("This is a trace message (most verbose)");
            log::debug!("This is a debug message (development only)");
            log::info!("This is an info message (production)");
            log::warn!("This is a warning message");
            // log::error!("This is an error message");

            Ok(())
        })
        .invoke_handler(builder.invoke_handler())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
