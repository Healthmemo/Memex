// Provenance scanner. For each markdown file in the vault, count claim
// sentences vs cited claims. A "claim" is any non-empty line of body text
// that is not a heading, list marker, code fence or comment. A "cited claim"
// is one that contains at least one `[^src-…]` footnote reference or a
// `<cite n="N"/>` tag.

use serde::Serialize;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize)]
pub struct ProvenanceRow {
    pub path: String,
    pub name: String,
    pub cited: u32,
    pub total: u32,
}

pub fn scan_provenance(vault_path: &str) -> Result<Vec<ProvenanceRow>, String> {
    let root = Path::new(vault_path)
        .canonicalize()
        .map_err(|e| format!("canonicalize failed: {e}"))?;
    if !root.is_dir() {
        return Err(format!("not a directory: {vault_path}"));
    }
    let files = collect_markdown(&root).map_err(|e| format!("walk failed: {e}"))?;
    let mut rows = Vec::with_capacity(files.len());
    for file in &files {
        let raw = match std::fs::read_to_string(file) {
            Ok(s) => s,
            Err(_) => continue,
        };
        let (cited, total) = count_claims(&raw);
        if total == 0 {
            continue;
        }
        rows.push(ProvenanceRow {
            path: file.to_string_lossy().into_owned(),
            name: file
                .file_name()
                .and_then(|s| s.to_str())
                .unwrap_or("")
                .to_string(),
            cited,
            total,
        });
    }
    rows.sort_by(|a, b| {
        let pa = a.cited as f64 / a.total.max(1) as f64;
        let pb = b.cited as f64 / b.total.max(1) as f64;
        pa.partial_cmp(&pb).unwrap_or(std::cmp::Ordering::Equal)
    });
    Ok(rows)
}

fn count_claims(text: &str) -> (u32, u32) {
    let mut total = 0u32;
    let mut cited = 0u32;
    let mut in_frontmatter = false;
    let mut in_code = false;
    let mut frontmatter_seen_open = false;
    for line in text.lines() {
        let trimmed = line.trim();
        if !frontmatter_seen_open && trimmed == "---" {
            frontmatter_seen_open = true;
            in_frontmatter = true;
            continue;
        }
        if in_frontmatter {
            if trimmed == "---" {
                in_frontmatter = false;
            }
            continue;
        }
        if trimmed.starts_with("```") {
            in_code = !in_code;
            continue;
        }
        if in_code {
            continue;
        }
        if trimmed.is_empty()
            || trimmed.starts_with('#')
            || trimmed.starts_with('>')
            || trimmed.starts_with("- ")
            || trimmed.starts_with("* ")
            || trimmed.starts_with("| ")
            || trimmed.starts_with("---")
            || trimmed.starts_with("![")
        {
            continue;
        }
        total += 1;
        if trimmed.contains("[^src-") || trimmed.contains("<cite n=\"") {
            cited += 1;
        }
    }
    (cited, total)
}

fn collect_markdown(dir: &Path) -> std::io::Result<Vec<PathBuf>> {
    let mut out = Vec::new();
    let mut stack = vec![dir.to_path_buf()];
    while let Some(d) = stack.pop() {
        for entry in std::fs::read_dir(&d)? {
            let e = entry?;
            let name = e.file_name();
            if name
                .to_str()
                .is_some_and(|s| s.starts_with('.') || s == "node_modules" || s == "target")
            {
                continue;
            }
            let p = e.path();
            if p.is_dir() {
                stack.push(p);
            } else if p.extension().and_then(|s| s.to_str()) == Some("md") {
                out.push(p);
            }
        }
    }
    out.sort();
    Ok(out)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_cited_vs_total() {
        let text = "---\ntitle: A\n---\n# Heading\n\nA claim without cite.\nA claim with cite[^src-x].\n";
        let (cited, total) = count_claims(text);
        assert_eq!(total, 2);
        assert_eq!(cited, 1);
    }

    #[test]
    fn skips_code_blocks() {
        let text = "Real claim.\n```\nfake claim inside code\n```\nAnother real.\n";
        let (_, total) = count_claims(text);
        assert_eq!(total, 2);
    }

    #[test]
    fn detects_cite_tag() {
        let text = "Body with cite tag.<cite n=\"1\"/>\n";
        let (cited, total) = count_claims(text);
        assert_eq!(cited, 1);
        assert_eq!(total, 1);
    }
}
