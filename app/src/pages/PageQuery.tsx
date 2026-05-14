// Ask the wiki — shells the prompt to `claude --print` with the vault as
// cwd. The CLI uses the user's existing Pro/Max subscription so we never
// touch an API key.

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { ipc } from "../lib/ipc";
import type { ClaudeStatus } from "../lib/ipc";
import { useVaultStore } from "../stores/vaultStore";

interface ChatTurn {
  q: string;
  a: string;
  error?: string;
}

const SYSTEM_PREAMBLE = `You are Memex, the wiki maintainer for the user's local markdown vault.
The current working directory is the vault root. Use Read/Grep/Glob tools to
look up answers from the wiki (\`wiki/\` if it exists) before reaching for
\`raw/\` sources. Answer in the user's language. When you state a fact that
comes from a vault file, cite it inline as [[page-stem]].`;

export default function PageQuery({ t }: { t: Strings }): JSX.Element {
  const currentVault = useVaultStore((s) => s.currentVault);
  const [status, setStatus] = useState<ClaudeStatus | null>(null);
  const [q, setQ] = useState("");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    ipc.claudeCheck().then(setStatus).catch(() => undefined);
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns.length]);

  async function ask(): Promise<void> {
    const question = q.trim();
    if (!question || !currentVault || busy) return;
    setQ("");
    setBusy(true);
    const pending: ChatTurn = { q: question, a: "" };
    setTurns((prev) => [...prev, pending]);
    try {
      const prompt = `${SYSTEM_PREAMBLE}\n\nQuestion:\n${question}`;
      const res = await ipc.claudeRun(prompt, currentVault.path);
      setTurns((prev) =>
        prev.map((turn, i) =>
          i === prev.length - 1
            ? {
                ...turn,
                a: res.stdout.trim() || res.stderr.trim() || "(empty response)",
                error: res.status !== 0 ? `exit ${res.status}` : undefined,
              }
            : turn,
        ),
      );
    } catch (err) {
      setTurns((prev) =>
        prev.map((turn, i) =>
          i === prev.length - 1 ? { ...turn, a: "", error: String(err) } : turn,
        ),
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_query}</div>
        <h1 className="page-title">{t.q_title}</h1>
        <p className="page-lede">{t.q_lede}</p>
      </header>

      {status && !status.installed ? (
        <div
          className="card-flat"
          style={{
            marginTop: 12,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            color: "var(--ink-3)",
          }}
        >
          <Icon name="info" size={16} />
          <div style={{ fontSize: 13.5 }}>
            <code style={{ fontFamily: "var(--font-mono)" }}>claude</code> CLI
            not detected on PATH. Install instructions:{" "}
            <a
              href="https://docs.claude.com/en/docs/claude-code"
              target="_blank"
              rel="noreferrer"
              style={{ color: "var(--ink)" }}
            >
              docs.claude.com/claude-code
            </a>
            .
          </div>
        </div>
      ) : null}

      <div
        className="card"
        style={{
          padding: 14,
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginTop: 8,
        }}
      >
        <Icon name="msg" size={16} />
        <input
          className="input"
          style={{ border: "none", padding: "4px 0", boxShadow: "none" }}
          placeholder={t.q_ph}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask();
          }}
          disabled={busy || !status?.installed || !currentVault}
        />
        <button
          className="btn btn-primary"
          onClick={() => void ask()}
          disabled={busy || !status?.installed || !currentVault || !q.trim()}
        >
          {busy ? "…" : t.q_send}
        </button>
      </div>

      <div className="col" style={{ marginTop: 24, gap: 16 }}>
        {turns.map((turn, i) => (
          <div key={i} className="card">
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="typebadge">
                <span
                  className="tb-dot"
                  style={{ background: "var(--ink)" }}
                ></span>
                you
              </span>
              <span style={{ fontWeight: 500 }}>{turn.q}</span>
            </div>
            <div className="prose" style={{ marginTop: 8 }}>
              {turn.error ? (
                <p style={{ color: "#dc2626" }}>{turn.error}</p>
              ) : turn.a ? (
                turn.a.split("\n").map((line, j) => (
                  <p key={j} style={{ margin: "4px 0" }}>
                    {line}
                  </p>
                ))
              ) : (
                <p className="muted">▌ thinking…</p>
              )}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
