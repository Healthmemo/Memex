// History page — git-style commit list. Sample data only.

import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";

export default function PageHistory({ t }: { t: Strings }): JSX.Element {
  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_history}</div>
        <h1 className="page-title">{t.h_title}</h1>
        <p className="page-lede">{t.h_lede}</p>
      </header>

      <div className="col" style={{ marginTop: 16, gap: 0 }}>
        {SAMPLE.history.map((h, i) => (
          <div
            key={h.hash}
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
                <span style={{ fontWeight: 600, fontSize: 15 }}>{h.source}</span>
                {i === 0 ? (
                  <span className="chip" style={{ background: "var(--ink)", color: "var(--bg)" }}>
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
                <span
                  className="chip"
                  style={{ background: "transparent", color: "var(--c-entity)" }}
                >
                  +{h.created} {t.h_created}
                </span>
                <span
                  className="chip"
                  style={{ background: "transparent", color: "var(--c-source)" }}
                >
                  ~{h.modified} {t.h_modified}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="btn">
                <Icon name="eye" size={13} /> {t.h_view}
              </button>
              {i > 0 ? (
                <button className="btn-ghost btn">
                  <Icon name="revert" size={13} /> {t.h_revert}
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      <div
        className="card-flat"
        style={{ marginTop: 24, display: "flex", gap: 12, alignItems: "flex-start" }}
      >
        <Icon name="info" size={16} />
        <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
          History is a real{" "}
          <code style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }}>git</code> log under the
          hood — every ingest commits the wiki folder.
        </div>
      </div>
    </div>
  );
}
