// Tauri IPC command surface. Each function is a thin adapter that delegates
// to a domain module (vault, parser, index). Keep this file free of business
// logic so the same modules remain unit-testable without Tauri runtime.

use crate::index::{self, Adjacency};
use crate::parser;
use crate::vault::{self, FileContent, FileNode, VaultMeta};

#[tauri::command]
pub fn open_vault(path: String) -> Result<VaultMeta, String> {
    vault::open_vault(&path)
}

#[tauri::command]
pub fn list_files(root: String) -> Result<Vec<FileNode>, String> {
    vault::list_files(&root)
}

#[tauri::command]
pub fn read_file(path: String) -> Result<FileContent, String> {
    vault::read_file(&path)
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<(), String> {
    vault::write_file(&path, &content)
}

#[tauri::command]
pub fn parse_links(path: String) -> Result<Vec<String>, String> {
    parser::parse_links(&path)
}

#[tauri::command]
pub fn build_link_graph(root: String) -> Result<Adjacency, String> {
    index::build_link_graph(&root)
}
