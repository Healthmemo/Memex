import type { JSX } from "react";
import { useEffect, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Splitter from "./components/Splitter";
import Editor from "./components/Editor";
import Viewer from "./components/Viewer";
import BacklinksPanel from "./components/BacklinksPanel";
import GraphView from "./components/GraphView";
import ModeToggle from "./components/ModeToggle";
import { getLastVaultPath, useVaultStore } from "./stores/vaultStore";
import { useUIStore } from "./stores/uiStore";
import { ipc } from "./lib/ipc";
import DialogHost from "./components/DialogHost";
import SettingsPanel from "./components/SettingsPanel";

const AUTOSAVE_MS = 2000;

export default function App(): JSX.Element {
  const activeFile = useVaultStore((s) => s.activeFile);
  const openFile = useVaultStore((s) => s.openFile);
  const openVault = useVaultStore((s) => s.openVault);
  const saveFile = useVaultStore((s) => s.saveFile);
  const resolveWikilink = useVaultStore((s) => s.resolveWikilink);
  const currentVault = useVaultStore((s) => s.currentVault);
  const error = useVaultStore((s) => s.error);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const viewMode = useUIStore((s) => s.viewMode);
  const topView = useUIStore((s) => s.topView);
  const setTopView = useUIStore((s) => s.setTopView);
  const setSettingsOpen = useUIStore((s) => s.setSettingsOpen);

  const [draftContent, setDraftContent] = useState<string>("");
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setDraftContent(activeFile?.content ?? "");
  }, [activeFile?.path, activeFile?.content]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--memex-sidebar-width",
      `${sidebarWidth}px`,
    );
  }, [sidebarWidth]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (currentVault) return;
    const last = getLastVaultPath();
    if (last) {
      void openVault(last);
      return;
    }
    // First launch: auto-create and open ~/Memex.
    void (async () => {
      try {
        const path = await ipc.ensureDefaultVault();
        await openVault(path);
      } catch {
        /* user can still pick manually */
      }
    })();
    // We only auto-restore once at mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function scheduleSave(path: string, content: string) {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      void saveFile(path, content);
    }, AUTOSAVE_MS);
  }

  function flushSave(path: string, content: string) {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    void saveFile(path, content);
  }

  return (
    <div className="memex-layout">
      <Sidebar onSelect={(p) => void openFile(p)} />
      <Splitter />
      <main className="memex-main">
        <header className="memex-main__header">
          <div className="memex-main__title">
            <h1>{activeFile ? fileName(activeFile.path) : "Memex"}</h1>
            {!activeFile ? (
              <p className="memex-main__tagline">
                Desktop wiki for plain markdown vaults.
              </p>
            ) : null}
          </div>
          <div className="memex-main__actions">
            <button
              type="button"
              className={`memex-modes__btn${
                topView === "graph" ? " memex-modes__btn--active" : ""
              }`}
              onClick={() =>
                setTopView(topView === "graph" ? "editor" : "graph")
              }
            >
              {topView === "graph" ? "Editor" : "Graph"}
            </button>
            {activeFile && topView === "editor" ? <ModeToggle /> : null}
            <button
              type="button"
              className="memex-modes__btn"
              title="Settings"
              onClick={() => setSettingsOpen(true)}
            >
              ⚙
            </button>
          </div>
        </header>
        {error ? <p className="memex-main__error">{error}</p> : null}
        {topView === "graph" ? (
          <GraphView />
        ) : (
          <section className={`memex-main__body memex-main__body--${viewMode}`}>
            {activeFile ? (
              <>
                {viewMode !== "preview" ? (
                  <Editor
                    docKey={activeFile.path}
                    initialValue={activeFile.content}
                    onChange={(c) => {
                      setDraftContent(c);
                      scheduleSave(activeFile.path, c);
                    }}
                    onSave={(c) => flushSave(activeFile.path, c)}
                  />
                ) : null}
                {viewMode !== "source" ? (
                  <Viewer
                    content={draftContent}
                    onLinkClick={(target) => {
                      const resolved = resolveWikilink(target);
                      if (resolved) void openFile(resolved);
                    }}
                  />
                ) : null}
              </>
            ) : (
              <p className="memex-main__placeholder">
                Open a vault to begin editing.
              </p>
            )}
          </section>
        )}
        {topView === "editor" ? <BacklinksPanel /> : null}
      </main>
      <DialogHost />
      <SettingsPanel />
    </div>
  );
}

function fileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
