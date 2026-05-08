import type { JSX } from "react";

export default function App(): JSX.Element {
  const isDev = import.meta.env.DEV;
  return (
    <main className="memex-shell">
      <header className="memex-shell__header">
        <h1>Memex</h1>
        <p className="memex-shell__tagline">
          Desktop wiki for plain markdown vaults.
        </p>
      </header>
      <section className="memex-shell__status" aria-live="polite">
        <p>Scaffold ready.</p>
        {isDev ? <p className="memex-shell__badge">dev mode</p> : null}
      </section>
    </main>
  );
}
