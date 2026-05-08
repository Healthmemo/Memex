# Changelog

All notable changes to Memex are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-09

Initial MVP release.

### Added

- Tauri 2 + React 18 + Vite 5 + TypeScript 5 application shell.
- Vault IPC: `open_vault`, `list_files`, `read_file`, `write_file`
  (atomic via tempfile + rename), `parse_links`, `build_link_graph`.
- Sidebar with collapsible folder tree and resizable splitter
  (200–600 px), state persisted to localStorage.
- CodeMirror 6 markdown editor with `⌘S` save and 2 s autosave debounce.
- markdown-it preview with custom `[[wikilink]]` rule rendering
  `<a data-link>` for app-level click resolution.
- Source / Preview / Split (50/50) view-mode toggle.
- Backlinks panel powered by the cached link graph.
- Cytoscape.js graph view with fcose layout, fit-to-viewport, click-to-open.
- Tag chip and folder dropdown filters for the graph.
- Tauri dialog plugin for directory picking; last vault path persisted
  across launches.
- macOS dmg + Windows nsis bundle targets.
