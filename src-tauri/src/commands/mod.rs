//! Tauri command handlers organized by domain.
//!
//! Each submodule contains related commands and their helper functions.
//! All public command functions are re-exported for use in `bindings.rs`.

pub mod notifications;
pub mod preferences;
pub mod quick_pane;
pub mod recovery;

pub use notifications::*;
pub use preferences::*;
pub use quick_pane::*;
pub use recovery::*;
