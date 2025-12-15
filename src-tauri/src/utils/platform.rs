//! Cross-platform utilities for handling platform-specific behavior.
//!
//! These utilities are provided for apps built on this template.
//! They may not be used within the template itself.
//!
//! This module provides utilities for writing cross-platform Rust code in Tauri apps.
//! Use conditional compilation (`#[cfg(target_os = "...")]`) for platform-specific behavior.
//!
//! # Examples
//!
//! ```ignore
//! use crate::utils::platform;
//!
//! // Normalize Windows paths to forward slashes for frontend
//! let normalized = platform::normalize_path_for_serialization(&some_path);
//!
//! // Platform-specific behavior with cfg
//! #[cfg(target_os = "macos")]
//! fn macos_specific() {
//!     // macOS-only code
//! }
//!
//! #[cfg(target_os = "windows")]
//! fn windows_specific() {
//!     // Windows-only code
//! }
//!
//! #[cfg(target_os = "linux")]
//! fn linux_specific() {
//!     // Linux-only code
//! }
//! ```

// Allow unused code - these utilities are for apps built on this template
#![allow(dead_code)]

use std::path::Path;

/// Normalizes a path to use forward slashes for consistent frontend handling.
///
/// Windows paths like `C:\Users\foo\bar.txt` become `C:/Users/foo/bar.txt`.
/// This is useful when sending paths to the React frontend, which expects
/// forward slashes regardless of the platform.
///
/// On macOS and Linux, paths are already using forward slashes, so this
/// is essentially a no-op but ensures consistency.
///
/// # Examples
///
/// ```ignore
/// use std::path::Path;
/// use crate::utils::platform::normalize_path_for_serialization;
///
/// let path = Path::new("some/path/file.txt");
/// let normalized = normalize_path_for_serialization(path);
/// assert_eq!(normalized, "some/path/file.txt");
/// ```
pub fn normalize_path_for_serialization(path: &Path) -> String {
    path.display().to_string().replace('\\', "/")
}

/// Returns true if running on macOS.
///
/// Use this for runtime checks. For compile-time checks, use `#[cfg(target_os = "macos")]`.
#[inline]
pub const fn is_macos() -> bool {
    cfg!(target_os = "macos")
}

/// Returns true if running on Windows.
///
/// Use this for runtime checks. For compile-time checks, use `#[cfg(target_os = "windows")]`.
#[inline]
pub const fn is_windows() -> bool {
    cfg!(target_os = "windows")
}

/// Returns true if running on Linux.
///
/// Use this for runtime checks. For compile-time checks, use `#[cfg(target_os = "linux")]`.
#[inline]
pub const fn is_linux() -> bool {
    cfg!(target_os = "linux")
}

/// Returns the current platform as a string ("macos", "windows", or "linux").
///
/// This can be useful when you need to pass the platform info to the frontend
/// without using the OS plugin.
pub const fn current_platform() -> &'static str {
    if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else {
        "linux"
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::path::PathBuf;

    #[test]
    fn test_normalize_path_forward_slashes() {
        let path = PathBuf::from("foo/bar/baz.txt");
        let normalized = normalize_path_for_serialization(&path);
        assert_eq!(normalized, "foo/bar/baz.txt");
    }

    #[test]
    fn test_normalize_path_empty() {
        let path = PathBuf::from("");
        let normalized = normalize_path_for_serialization(&path);
        assert_eq!(normalized, "");
    }

    #[test]
    fn test_current_platform_is_valid() {
        let platform = current_platform();
        assert!(
            platform == "macos" || platform == "windows" || platform == "linux",
            "Platform should be one of: macos, windows, linux"
        );
    }

    #[test]
    fn test_platform_detection_consistency() {
        // Only one of these should be true
        let platforms = [is_macos(), is_windows(), is_linux()];
        let count = platforms.iter().filter(|&&x| x).count();
        assert_eq!(count, 1, "Exactly one platform should be detected");
    }
}
