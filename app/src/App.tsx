import type { JSX } from "react";
import Sidebar from "./components/Sidebar";
import { useVaultStore } from "./stores/vaultStore";

export default function App(): JSX.Element {
  const activeFile = useVaultStore((s) => s.activeFile);
  const openFile = useVaultStore((s) => s.openFile);
  const error = useVaultStore((s) => s.error);

  return (
    <div className="memex-layout">
      <Sidebar onSelect={(p) => void openFile(p)} />
      <main className="memex-main">
        <header className="memex-main__header">
          <h1>{activeFile ? fileName(activeFile.path) : "Memex"}</h1>
          {!activeFile ? (
            <p className="memex-main__tagline">
              Desktop wiki for plain markdown vaults.
            </p>
          ) : null}
        </header>
        {error ? <p className="memex-main__error">{error}</p> : null}
        <section className="memex-main__placeholder">
          {activeFile ? (
            <pre className="memex-main__raw">{activeFile.content}</pre>
          ) : (
            <p>Open a vault to begin editing.</p>
          )}
        </section>
      </main>
    </div>
  );
}

function fileName(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}
