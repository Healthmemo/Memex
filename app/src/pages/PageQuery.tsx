// Ask the wiki page. Mock answer until LLM is wired.

import { useState } from "react";
import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";

export default function PageQuery({ t }: { t: Strings }): JSX.Element {
  const [q, setQ] = useState("");
  const [answered, setAnswered] = useState(false);
  const [thinking, setThinking] = useState(false);

  function ask(): void {
    if (!q.trim()) return;
    setThinking(true);
    setAnswered(false);
    setTimeout(() => {
      setThinking(false);
      setAnswered(true);
    }, 900);
  }

  function renderAnswer(md: string): JSX.Element[] {
    const parts = md.split(/(<cite n="\d+"\/>)/g);
    return parts.map((p, i) => {
      const m = /<cite n="(\d+)"\/>/.exec(p);
      if (m) return <span key={i} className="cite-pill">{m[1]}</span>;
      const html = p.replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
      return <span key={i} dangerouslySetInnerHTML={{ __html: html }} />;
    });
  }

  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_query}</div>
        <h1 className="page-title">{t.q_title}</h1>
        <p className="page-lede">{t.q_lede}</p>
      </header>

      <div className="card" style={{ padding: 14, display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
        <Icon name="msg" size={16} />
        <input
          className="input"
          style={{ border: "none", padding: "4px 0", boxShadow: "none" }}
          placeholder={t.q_ph}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
        />
        <button className="btn btn-primary" onClick={ask} disabled={thinking}>
          {thinking ? "…" : t.q_send}
        </button>
      </div>

      {(thinking || answered) && (
        <div style={{ marginTop: 24 }}>
          <div className="row" style={{ marginBottom: 12 }}>
            <span className="typebadge">
              <span className="tb-dot" style={{ background: "var(--ink)" }}></span>
              {t.q_answer}
            </span>
            <span className="chip">
              <span className="chip-dot t-source"></span>3 {t.q_wiki}
            </span>
            <span className="chip">
              <span className="chip-dot t-overview"></span>1 {t.q_raw}
            </span>
          </div>
          <div className="prose">
            {thinking ? (
              <div className="muted">▌ Searching wiki…</div>
            ) : (
              SAMPLE.sampleAnswer.split("\n\n").map((para, i) => {
                if (para.startsWith("# ")) return <h2 key={i}>{para.slice(2)}</h2>;
                if (/^\d+\. /.test(para)) {
                  return (
                    <ol key={i}>
                      {para.split("\n").map((li, j) => (
                        <li key={j}>{renderAnswer(li.replace(/^\d+\. /, ""))}</li>
                      ))}
                    </ol>
                  );
                }
                return <p key={i}>{renderAnswer(para)}</p>;
              })
            )}
          </div>

          {answered ? (
            <>
              <div className="section-head">
                <div className="section-title" style={{ fontSize: 14 }}>
                  {t.q_sources_used}
                </div>
              </div>
              <div className="col">
                {SAMPLE.sampleCitations.map((c) => {
                  const p = SAMPLE.pages.find((x) => x.id === c.page);
                  if (!p) return null;
                  return (
                    <div
                      key={c.n}
                      className="card-flat"
                      style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
                    >
                      <span className="cite-pill" style={{ marginTop: 2 }}>
                        {c.n}
                      </span>
                      <div style={{ flex: 1 }}>
                        <div className="row" style={{ marginBottom: 4 }}>
                          <span className="typebadge">
                            <span className={`tb-dot t-${p.type}`}></span>
                            {p.type}
                          </span>
                          <span style={{ fontWeight: 500, color: "var(--ink)" }}>{p.title}</span>
                        </div>
                        <div
                          className="muted"
                          style={{ fontSize: 13.5, fontStyle: "italic" }}
                        >
                          &ldquo;{c.excerpt}&rdquo;
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : null}
        </div>
      )}

      <div className="section-head">
        <div className="section-title" style={{ fontSize: 14 }}>
          {t.q_recent}
        </div>
      </div>
      <div className="list">
        {SAMPLE.recentQueries.map((r, i) => (
          <button
            key={i}
            className="list-row"
            onClick={() => {
              setQ(r.q);
              ask();
            }}
            style={{ background: "transparent", border: 0, textAlign: "left" }}
          >
            <span className="ic">
              <Icon name="msg" size={13} />
            </span>
            <span>{r.q}</span>
            <span className="meta">
              {r.wiki} {t.q_wiki} · {r.raw} {t.q_raw}
            </span>
            <span className="ic">
              <Icon name="chevR" size={12} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
