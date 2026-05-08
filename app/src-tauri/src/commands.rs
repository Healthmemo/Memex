// Tauri IPC command surface. Each function is a thin adapter that delegates
// to a domain module (vault, parser, index). Keep this file free of business
// logic so the same modules remain unit-testable without Tauri runtime.

use crate::vault::{self, VaultMeta};

#[tauri::command]
pub fn open_vault(path: String) -> Result<VaultMeta, String> {
    vault::open_vault(&path)
}
