// Vault filesystem operations: open, list, read, write.
// All paths returned to the frontend are canonical absolute paths so the
// frontend can use them as stable file identifiers.

use serde::Serialize;
use std::path::Path;

#[derive(Debug, Clone, Serialize)]
pub struct VaultMeta {
    pub path: String,
    pub name: String,
}

pub fn open_vault(path: &str) -> Result<VaultMeta, String> {
    if path.is_empty() {
        return Err("vault path is empty".into());
    }

    let candidate = Path::new(path);
    if !candidate.exists() {
        return Err(format!("path does not exist: {path}"));
    }
    if !candidate.is_dir() {
        return Err(format!("not a directory: {path}"));
    }

    let canonical = candidate
        .canonicalize()
        .map_err(|e| format!("failed to canonicalize {path}: {e}"))?;

    let name = canonical
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("vault")
        .to_string();

    Ok(VaultMeta {
        path: canonical.to_string_lossy().into_owned(),
        name,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env;

    #[test]
    fn open_vault_rejects_empty() {
        assert!(open_vault("").is_err());
    }

    #[test]
    fn open_vault_rejects_missing_path() {
        let missing = env::temp_dir().join("memex-does-not-exist-xyz");
        assert!(open_vault(missing.to_str().unwrap()).is_err());
    }

    #[test]
    fn open_vault_returns_meta_for_existing_dir() {
        let tmp = env::temp_dir();
        let meta = open_vault(tmp.to_str().unwrap()).unwrap();
        assert!(!meta.name.is_empty());
        assert!(!meta.path.is_empty());
    }
}
