// Command palette (⌘K). Searches navigation routes and vault file leaves.

import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { IconName } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { useUIStore } from "../stores/uiStore";
import type { RouteId } from "../stores/uiStore";
import { useVaultStore } from "../stores/vaultStore";
import type { FileNode } from "../lib/ipc";

interface CmdEntry {
  type: "nav" | "page";
  label: string;
  to: RouteId;
}

export default function CommandBar({ t }: { t: Strings }): JSX.Element | null {
  const open = useUIStore((s) => s.cmdOpen);
  const setCmdOpen = useUIStore((s) => s.setCmdOpen);
  const setRoute = useUIStore((s) => s.setRoute);
  const fileTree = useVaultStore((s) => s.fileTree);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    if (!open) setQ("");
  }, [open]);

  const all: CmdEntry[] = useMemo(() => {
    const navs: CmdEntry[] = [
      { type: "nav", label: t.nav_overview, to: "overview" },
      { type: "nav", label: t.nav_ingest, to: "ingest" },
      { type: "nav", label: t.nav_query, to: "query" },
      { type: "nav", label: t.nav_graph, to: "graph" },
      { type: "nav", label: t.nav_history, to: "history" },
      { type: "nav", label: t.nav_provenance, to: "provenance" },
      { type: "nav", label: t.nav_settings, to: "settings" },
    ];
    const pages: CmdEntry[] = collectFiles(fileTree).map((n) => ({
      type: "page",
      label: n.name.replace(/\.md$/i, ""),
      to: `page:${n.path}` as RouteId,
    }));
    return [...navs, ...pages];
  }, [t, fileTree]);

  if (!open) return null;
  const filtered = q.trim()
    ? all.filter((x) => x.label.toLowerCase().includes(q.toLowerCase()))
    : all.slice(0, 12);

  function go(entry: CmdEntry): void {
    setRoute(entry.to);
    setCmdOpen(false);
  }

  return (
    <div className="cmd-overlay" onClick={() => setCmdOpen(false)}>
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input">
          <Icon name="search" size={16} />
          <input
            ref={inputRef}
            placeholder={t.ph_search}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") setCmdOpen(false);
              if (e.key === "Enter" && filtered[0]) go(filtered[0]);
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 ? (
            <div className="cmd-row muted">No results</div>
          ) : null}
          {filtered.map((r, i) => (
            <button
              key={`${r.type}-${r.to}-${i}`}
              className="cmd-row"
              onClick={() => go(r)}
              style={{
                width: "100%",
                background: "transparent",
                border: 0,
                textAlign: "left",
              }}
            >
              <Icon name={iconFor(r)} size={13} />
              <span>{r.label}</span>
              <span className="cr-tag">
                {r.type === "nav" ? "page" : "file"}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function iconFor(entry: CmdEntry): IconName {
  if (entry.type === "page") return "page";
  if (entry.to === "overview") return "home";
  if (entry.to === "graph") return "graph";
  if (entry.to === "history") return "history";
  if (entry.to === "provenance") return "quote";
  if (entry.to === "ingest") return "upload";
  if (entry.to === "query") return "msg";
  if (entry.to === "settings") return "settings";
  return "arrowR";
}

function collectFiles(tree: FileNode[]): FileNode[] {
  const out: FileNode[] = [];
  const stack = [...tree];
  while (stack.length) {
    const n = stack.pop();
    if (!n) continue;
    if (n.kind === "file") out.push(n);
    else stack.push(...n.children);
  }
  return out;
}
