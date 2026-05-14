// History page — reads `git log` from the vault directory. If the vault is
// not a git repo we explain how to initialize one.

import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { ipc } from "../lib/ipc";
import type { GitCommit } from "../lib/ipc";
import { useVaultStore } from "../stores/vaultStore";

export default function PageHistory({ t }: { t: Strings }): JSX.Element {
  const currentVault = useVaultStore((s) => s.currentVault);
  const [commits, setCommits] = useState<GitCommit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentVault) return;
    setLoading(true);
    setError(null);
    ipc
      .gitLog(currentVault.path, 50)
      .then(setCommits)
      .catch((e: unknown) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [currentVault]);

  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_history}</div>
        <h1 className="page-title">{t.h_title}</h1>
        <p className="page-lede">{t.h_lede}</p>
      </header>

      {!currentVault ? (
        <p className="muted">Open a vault to see history.</p>
      ) : loading ? (
        <p className="muted">Loading…</p>
      ) : error ? (
        <div className="card-flat" style={{ color: "#dc2626" }}>
          {error}
        </div>
      ) : !commits || commits.length === 0 ? (
        <div
          className="card-flat"
          style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
        >
          <Icon name="info" size={16} />
          <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
            This vault is not under git yet. From a terminal:{" "}
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>
              cd {currentVault.path} && git init && git add -A && git commit -m
              init
            </code>
            .
          </div>
        </div>
      ) : (
        <div className="col" style={{ marginTop: 16, gap: 0 }}>
          {commits.map((h, i) => (
            <div
              key={`${h.hash}-${i}`}
              className="card"
              style={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                gap: 16,
                alignItems: "center",
                padding: 16,
                borderRadius: 10,
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 8,
                  background: i === 0 ? "var(--ink)" : "var(--bg-soft)",
                  color: i === 0 ? "var(--bg)" : "var(--ink-3)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Icon name={i === 0 ? "spark" : "save"} size={16} />
              </div>
              <div>
                <div className="row" style={{ marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 15 }}>
                    {h.subject}
                  </span>
                  {i === 0 ? (
                    <span
                      className="chip"
                      style={{ background: "var(--ink)", color: "var(--bg)" }}
                    >
                      HEAD
                    </span>
                  ) : null}
                </div>
                <div className="row" style={{ gap: 12 }}>
                  <span
                    className="meta muted"
                    style={{ fontSize: 12.5, fontFamily: "var(--font-mono)" }}
                  >
                    {h.hash}
                  </span>
                  <span className="muted" style={{ fontSize: 12.5 }}>
                    {h.date}
                  </span>
                  {h.created > 0 ? (
                    <span
                      className="chip"
                      style={{ background: "transparent", color: "var(--c-entity)" }}
                    >
                      +{h.created}
                    </span>
                  ) : null}
                  {h.modified > 0 ? (
                    <span
                      className="chip"
                      style={{ background: "transparent", color: "var(--c-source)" }}
                    >
                      ~{h.modified} files
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
