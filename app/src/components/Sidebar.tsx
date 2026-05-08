// Sidebar — left navigation, Notion-flavored. Reads vault file tree from
// vaultStore and groups pages by folder name for the Pages section.

import type { JSX, MouseEvent } from "react";
import { Icon, MemexMark } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { useUIStore } from "../stores/uiStore";
import { useVaultStore } from "../stores/vaultStore";
import { ipc } from "../lib/ipc";
import type { FileNode } from "../lib/ipc";
import { promptText, confirmAction } from "../stores/dialogStore";
import { SAMPLE } from "../lib/sample";

interface Folder {
  id: string;
  label: string;
}

export default function Sidebar({ t }: { t: Strings }): JSX.Element {
  const route = useUIStore((s) => s.route);
  const setRoute = useUIStore((s) => s.setRoute);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const toggleCmd = useUIStore((s) => s.toggleCmd);
  const expandedFolders = useUIStore((s) => s.expandedFolders);
  const toggleFolder = useUIStore((s) => s.toggleFolder);
  const fileTree = useVaultStore((s) => s.fileTree);
  const currentVault = useVaultStore((s) => s.currentVault);
  const openVault = useVaultStore((s) => s.openVault);

  const folders: Folder[] = [
    { id: "sources", label: t.folder_sources },
    { id: "entities", label: t.folder_entities },
    { id: "concepts", label: t.folder_concepts },
    { id: "techniques", label: t.folder_techniques },
    { id: "analyses", label: t.folder_analyses },
  ];

  const grouped = groupVaultFolders(fileTree, folders);
  const totalPages = Object.values(grouped).reduce(
    (s, arr) => s + arr.length,
    0,
  );

  async function pickVault() {
    const path = await ipc.pickDirectory();
    if (path) await openVault(path);
  }

  return (
    <aside className="sidebar">
      <div className="side-head">
        <button className="brand" onClick={toggleSidebar}>
          <span className="brand-mark">
            <MemexMark size={20} />
          </span>
          <span className="brand-name">{t.app_name}</span>
          <span className="brand-caret">
            <Icon name="sidebar" size={14} />
          </span>
        </button>
        <button className="proj-switch" onClick={() => void pickVault()}>
          <span className="proj-icon">
            {currentVault?.name?.charAt(0).toUpperCase() ?? "·"}
          </span>
          <span className="proj-name">
            {currentVault?.name ?? "No vault"}
          </span>
          <span className="proj-meta">{totalPages || ""}</span>
          <Icon name="chevD" size={12} />
        </button>
      </div>

      <div className="side-quick">
        <button className="qbtn" onClick={toggleCmd}>
          <span className="qicon">
            <Icon name="search" />
          </span>
          <span>{t.quick_search}</span>
          <span className="qkbd">⌘K</span>
        </button>
        <button
          className={"qbtn" + (route === "ingest" ? " active" : "")}
          onClick={() => setRoute("ingest")}
        >
          <span className="qicon">
            <Icon name="upload" />
          </span>
          <span>{t.quick_ingest}</span>
        </button>
        <button
          className={"qbtn" + (route === "query" ? " active" : "")}
          onClick={() => setRoute("query")}
        >
          <span className="qicon">
            <Icon name="msg" />
          </span>
          <span>{t.quick_ask}</span>
        </button>
      </div>

      <nav className="side-nav">
        <div className="nav-group">
          <div className="nav-group-label">{t.nav_workspace}</div>
          <NavItem
            label={t.nav_overview}
            icon="home"
            active={route === "overview"}
            onClick={() => setRoute("overview")}
          />
          <NavItem
            label={t.nav_graph}
            icon="graph"
            active={route === "graph"}
            onClick={() => setRoute("graph")}
          />
          <NavItem
            label={t.nav_history}
            icon="history"
            active={route === "history"}
            onClick={() => setRoute("history")}
            count={SAMPLE.history.length}
          />
          <NavItem
            label={t.nav_provenance}
            icon="quote"
            active={route === "provenance"}
            onClick={() => setRoute("provenance")}
          />
        </div>

        <div className="nav-group">
          <div className="nav-group-label">
            <span>{t.nav_pages}</span>
            <NewPageButton parentDir={currentVault?.path ?? ""} />
          </div>
          {folders.map((f) => {
            const items = grouped[f.id] ?? [];
            const open = expandedFolders[f.id] ?? true;
            return (
              <FolderRow
                key={f.id}
                folder={f}
                items={items}
                open={open}
                route={route}
                setRoute={setRoute}
                onToggle={() => toggleFolder(f.id)}
              />
            );
          })}
        </div>

        <div className="nav-group">
          <div className="nav-group-label">{t.nav_tools}</div>
          <NavItem
            label={t.nav_settings}
            icon="settings"
            active={route === "settings"}
            onClick={() => setRoute("settings")}
          />
        </div>
      </nav>

      <div className="side-foot">
        <div className="status-row">
          <span className="sdot"></span>
          <span>
            Claude CLI <b>online</b>
          </span>
          <span className="sr-action">v0.42</span>
        </div>
        <div className="status-row">
          <span className="sdot"></span>
          <span>
            Vault <b>{currentVault ? "linked" : "—"}</b>
          </span>
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  label,
  icon,
  active,
  onClick,
  count,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]["name"];
  active: boolean;
  onClick: () => void;
  count?: number;
}): JSX.Element {
  return (
    <button
      className={"nav-item" + (active ? " active" : "")}
      onClick={onClick}
    >
      <span className="ni-caret"></span>
      <span className="ni-icon">
        <Icon name={icon} size={15} />
      </span>
      <span className="ni-text">{label}</span>
      {count !== undefined ? <span className="ni-count">{count}</span> : null}
    </button>
  );
}

function FolderRow({
  folder,
  items,
  open,
  route,
  setRoute,
  onToggle,
}: {
  folder: Folder;
  items: FileNode[];
  open: boolean;
  route: string;
  setRoute: (r: `page:${string}`) => void;
  onToggle: () => void;
}): JSX.Element {
  return (
    <>
      <button className="nav-item" onClick={onToggle}>
        <span className={"ni-caret" + (open ? " open" : "")}>
          <Icon name="chevR" size={10} />
        </span>
        <span className="ni-icon">
          <Icon name="folder" />
        </span>
        <span className="ni-text">{folder.label}</span>
        <span className="ni-count">{items.length}</span>
      </button>
      {open ? (
        <div className="nav-children">
          {items.map((node) => (
            <PageLeaf
              key={node.path}
              node={node}
              active={route === `page:${node.path}`}
              onClick={() => setRoute(`page:${node.path}`)}
            />
          ))}
        </div>
      ) : null}
    </>
  );
}

function PageLeaf({
  node,
  active,
  onClick,
}: {
  node: FileNode;
  active: boolean;
  onClick: () => void;
}): JSX.Element {
  if (node.kind === "directory") {
    return (
      <button className="nav-leaf" onClick={onClick}>
        <span className="nl-dot t-overview"></span>
        <span className="nl-text">{node.name}/</span>
      </button>
    );
  }
  const tone = inferType(node.name);
  return (
    <button
      className={"nav-leaf" + (active ? " active" : "")}
      onClick={onClick}
      onContextMenu={(e) => void contextMenu(e, node)}
    >
      <span className={`nl-dot t-${tone}`}></span>
      <span className="nl-text">{stripExt(node.name)}</span>
    </button>
  );
}

function NewPageButton({ parentDir }: { parentDir: string }): JSX.Element {
  const createFile = useVaultStore((s) => s.createFile);
  return (
    <button
      className="ngl-add"
      title="New page"
      disabled={!parentDir}
      onClick={async () => {
        if (!parentDir) return;
        const name = await promptText({
          title: "New note",
          message: "File name (.md will be added automatically)",
          placeholder: "untitled",
        });
        if (!name) return;
        const finalName = name.endsWith(".md") ? name : `${name}.md`;
        await createFile(parentDir, finalName);
      }}
    >
      <Icon name="plus" size={12} />
    </button>
  );
}

async function contextMenu(e: MouseEvent, node: FileNode): Promise<void> {
  e.preventDefault();
  const ok = await confirmAction({
    title: `Delete "${node.name}"?`,
    message: "This cannot be undone.",
    danger: true,
  });
  if (ok) {
    await useVaultStore.getState().deletePath(node.path);
  }
}

function inferType(filename: string): string {
  const lower = filename.toLowerCase();
  if (lower.startsWith("source-") || lower.startsWith("src-")) return "source";
  if (lower.startsWith("analysis-") || lower.includes("vs-")) return "analysis";
  if (lower.includes("technique") || lower.includes("bpe") || lower.includes("encoding")) return "technique";
  if (lower.includes("pipeline") || lower.includes("paradigm")) return "concept";
  return "entity";
}

function stripExt(name: string): string {
  return name.replace(/\.md$/i, "");
}

function groupVaultFolders(
  tree: FileNode[],
  folders: Folder[],
): Record<string, FileNode[]> {
  const result: Record<string, FileNode[]> = {};
  for (const f of folders) result[f.id] = [];

  for (const node of tree) {
    if (node.kind === "directory") {
      const key = matchFolder(node.name, folders);
      if (key) {
        result[key].push(...flattenFiles(node));
      } else {
        // unknown directory: stick into entities by default
        result.entities.push(...flattenFiles(node));
      }
    } else {
      result.sources.push(node);
    }
  }
  return result;
}

function matchFolder(name: string, folders: Folder[]): string | null {
  const n = name.toLowerCase();
  for (const f of folders) {
    if (f.id === n || f.id.startsWith(n) || n.startsWith(f.id)) return f.id;
  }
  if (n.startsWith("raw")) return "sources";
  if (n.startsWith("wiki")) return "entities";
  return null;
}

function flattenFiles(node: FileNode): FileNode[] {
  if (node.kind === "file") return [node];
  return node.children.flatMap(flattenFiles);
}
