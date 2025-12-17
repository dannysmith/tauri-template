//! Quick pane window management commands.
//!
//! The quick pane is a floating panel (NSPanel on macOS, standard window elsewhere)
//! that provides quick entry functionality accessible via global shortcut.

use std::sync::Mutex;
use tauri::{AppHandle, Manager, WebviewUrl};

use crate::types::DEFAULT_QUICK_PANE_SHORTCUT;

// ============================================================================
// Constants
// ============================================================================

/// Window label for the quick pane
const QUICK_PANE_LABEL: &str = "quick-pane";

/// Quick pane window dimensions
const QUICK_PANE_WIDTH: f64 = 500.0;
const QUICK_PANE_HEIGHT: f64 = 72.0;

/// Tracks the currently registered quick pane shortcut for selective unregistration.
/// This allows us to unregister only our shortcut without affecting other shortcuts.
static CURRENT_QUICK_PANE_SHORTCUT: Mutex<Option<String>> = Mutex::new(None);

// ============================================================================
// macOS-specific: NSPanel support
// ============================================================================

#[cfg(target_os = "macos")]
use tauri_nspanel::{
    tauri_panel, CollectionBehavior, ManagerExt, PanelBuilder, PanelLevel, StyleMask,
};

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

// ============================================================================
// Window Initialization
// ============================================================================

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
                .transparent(true)
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
    use tauri::webview::WebviewWindowBuilder;

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

// ============================================================================
// Window Positioning
// ============================================================================

/// Gets the monitor containing the given cursor position, falling back to primary monitor.
fn get_monitor_for_cursor(
    app: &AppHandle,
    cursor_pos: tauri::PhysicalPosition<f64>,
) -> Option<tauri::Monitor> {
    match app.monitor_from_point(cursor_pos.x, cursor_pos.y) {
        Ok(Some(m)) => Some(m),
        Ok(None) => {
            log::warn!("No monitor found at cursor position, trying primary monitor");
            app.primary_monitor().ok().flatten()
        }
        Err(e) => {
            log::warn!("Failed to get monitor from point: {e}");
            app.primary_monitor().ok().flatten()
        }
    }
}

/// Calculates the position to center a window on the monitor containing the cursor.
/// Falls back to primary monitor if cursor monitor cannot be determined.
fn get_centered_position_on_cursor_monitor(
    app: &AppHandle,
) -> Option<tauri::PhysicalPosition<i32>> {
    // Get cursor position
    let cursor_pos = match app.cursor_position() {
        Ok(pos) => pos,
        Err(e) => {
            log::warn!("Failed to get cursor position: {e}");
            return None;
        }
    };

    log::debug!("Cursor position: ({}, {})", cursor_pos.x, cursor_pos.y);

    // Get the monitor containing the cursor
    let monitor = get_monitor_for_cursor(app, cursor_pos)?;

    let monitor_pos = monitor.position();
    let monitor_size = monitor.size();
    let scale_factor = monitor.scale_factor();

    log::debug!(
        "Monitor: pos=({}, {}), size={}x{}, scale={}",
        monitor_pos.x,
        monitor_pos.y,
        monitor_size.width,
        monitor_size.height,
        scale_factor
    );

    // Calculate centered position on this monitor
    // Window size needs to be scaled by the monitor's scale factor
    let scaled_width = (QUICK_PANE_WIDTH * scale_factor) as i32;
    let scaled_height = (QUICK_PANE_HEIGHT * scale_factor) as i32;

    let x = monitor_pos.x + (monitor_size.width as i32 - scaled_width) / 2;
    let y = monitor_pos.y + (monitor_size.height as i32 - scaled_height) / 2;

    log::debug!("Calculated position: ({x}, {y})");

    Some(tauri::PhysicalPosition::new(x, y))
}

/// Positions the quick pane window centered on the monitor containing the cursor.
fn position_quick_pane_on_cursor_monitor(app: &AppHandle) {
    if let Some(position) = get_centered_position_on_cursor_monitor(app) {
        if let Some(window) = app.get_webview_window(QUICK_PANE_LABEL) {
            if let Err(e) = window.set_position(position) {
                log::warn!("Failed to set window position: {e}");
            }
        }
    }
}

// ============================================================================
// Window Visibility
// ============================================================================

/// Returns whether the quick pane is currently visible.
fn is_quick_pane_visible(app: &AppHandle) -> bool {
    #[cfg(target_os = "macos")]
    {
        app.get_webview_panel(QUICK_PANE_LABEL)
            .map(|panel| panel.is_visible())
            .unwrap_or(false)
    }

    #[cfg(not(target_os = "macos"))]
    {
        app.get_webview_window(QUICK_PANE_LABEL)
            .and_then(|window| window.is_visible().ok())
            .unwrap_or(false)
    }
}

/// Shows the quick pane window and makes it the key window (for keyboard input).
#[tauri::command]
#[specta::specta]
pub fn show_quick_pane(app: AppHandle) -> Result<(), String> {
    log::info!("Showing quick pane window");

    position_quick_pane_on_cursor_monitor(&app);

    #[cfg(target_os = "macos")]
    {
        let panel = app
            .get_webview_panel(QUICK_PANE_LABEL)
            .map_err(|e| format!("Quick pane panel not found: {e:?}"))?;
        panel.show_and_make_key();
        log::debug!("Quick pane panel shown (macOS)");
    }

    #[cfg(not(target_os = "macos"))]
    {
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
    }

    Ok(())
}

/// Dismisses the quick pane window.
/// On macOS, resigns key window status before hiding to avoid activating main window.
#[tauri::command]
#[specta::specta]
pub fn dismiss_quick_pane(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        if let Ok(panel) = app.get_webview_panel(QUICK_PANE_LABEL) {
            // Guard: resign_key_window triggers blur event which calls dismiss again
            if !panel.is_visible() {
                return Ok(());
            }
            log::info!("Dismissing quick pane window");
            // Resign key window BEFORE hiding to prevent macOS from
            // activating our main window (which would cause space switching)
            panel.resign_key_window();
            panel.hide();
            log::debug!("Quick pane panel dismissed (macOS)");
        }
    }

    #[cfg(not(target_os = "macos"))]
    {
        if let Some(window) = app.get_webview_window(QUICK_PANE_LABEL) {
            let is_visible = window.is_visible().unwrap_or(false);
            if !is_visible {
                log::debug!("Quick pane already hidden, skipping");
                return Ok(());
            }
            log::info!("Dismissing quick pane window");
            window
                .hide()
                .map_err(|e| format!("Failed to hide window: {e}"))?;
            log::debug!("Quick pane window hidden");
        }
    }

    Ok(())
}

/// Toggles the quick pane window visibility.
#[tauri::command]
#[specta::specta]
pub fn toggle_quick_pane(app: AppHandle) -> Result<(), String> {
    log::info!("Toggling quick pane window");

    if is_quick_pane_visible(&app) {
        dismiss_quick_pane(app)
    } else {
        show_quick_pane(app)
    }
}

// ============================================================================
// Shortcut Management
// ============================================================================

/// Registers the quick pane global shortcut, unregistering any previously registered one.
/// This helper is used by both setup() and update_quick_pane_shortcut() for consistency.
#[cfg(desktop)]
pub fn register_quick_pane_shortcut(app: &AppHandle, shortcut: &str) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut};

    let global_shortcut = app.global_shortcut();

    // Lock the mutex to get the current shortcut and update it atomically
    let mut current_shortcut = CURRENT_QUICK_PANE_SHORTCUT
        .lock()
        .map_err(|e| format!("Failed to lock shortcut mutex: {e}"))?;

    // Unregister the old shortcut if one exists
    if let Some(old_shortcut_str) = current_shortcut.take() {
        log::debug!("Unregistering old quick pane shortcut: {old_shortcut_str}");
        // Parse the old shortcut string into a Shortcut
        match old_shortcut_str.parse::<Shortcut>() {
            Ok(old_shortcut) => {
                if let Err(e) = global_shortcut.unregister(old_shortcut) {
                    log::warn!("Failed to unregister old shortcut '{old_shortcut_str}': {e}");
                    // Continue anyway - the old shortcut may have already been unregistered
                }
            }
            Err(e) => {
                log::warn!("Failed to parse old shortcut '{old_shortcut_str}': {e}");
                // Continue anyway - if we can't parse it, we can't unregister it
            }
        }
    }

    // Register the new shortcut
    let app_handle = app.clone();
    global_shortcut
        .on_shortcut(shortcut, move |_app, _shortcut, event| {
            use tauri_plugin_global_shortcut::ShortcutState;
            if event.state == ShortcutState::Pressed {
                log::info!("Quick pane shortcut triggered");
                if let Err(e) = toggle_quick_pane(app_handle.clone()) {
                    log::error!("Failed to toggle quick pane: {e}");
                }
            }
        })
        .map_err(|e| format!("Failed to register shortcut '{shortcut}': {e}"))?;

    // Store the new shortcut for future unregistration
    *current_shortcut = Some(shortcut.to_string());
    log::debug!("Registered quick pane shortcut: {shortcut}");

    Ok(())
}

/// Returns the default shortcut constant for frontend use.
#[tauri::command]
#[specta::specta]
pub fn get_default_quick_pane_shortcut() -> String {
    DEFAULT_QUICK_PANE_SHORTCUT.to_string()
}

/// Updates the global shortcut for the quick pane.
/// Pass None to reset to default.
#[tauri::command]
#[specta::specta]
pub fn update_quick_pane_shortcut(app: AppHandle, shortcut: Option<String>) -> Result<(), String> {
    #[cfg(desktop)]
    {
        let new_shortcut = shortcut.as_deref().unwrap_or(DEFAULT_QUICK_PANE_SHORTCUT);
        log::info!("Updating quick pane shortcut to: {new_shortcut}");

        register_quick_pane_shortcut(&app, new_shortcut)?;

        log::info!("Quick pane shortcut updated successfully");
    }

    #[cfg(not(desktop))]
    {
        let _ = (app, shortcut);
        log::warn!("Global shortcuts not supported on this platform");
    }

    Ok(())
}
