// Provenance page — claim coverage per page. Sample data only.

import { useState } from "react";
import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";

export default function PageProvenance({ t }: { t: Strings }): JSX.Element {
  const [threshold, setThreshold] = useState(0.7);
  const rows = [...SAMPLE.provenance].sort(
    (a, b) => a.cited / a.total - b.cited / b.total,
  );
  const totalCited = rows.reduce((s, r) => s + r.cited, 0);
  const totalAll = rows.reduce((s, r) => s + r.total, 0);
  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_provenance}</div>
        <h1 className="page-title">{t.p_title}</h1>
        <p className="page-lede">{t.p_lede}</p>
      </header>

      <div className="row" style={{ marginTop: 16 }}>
        <div className="card-flat" style={{ flex: 1, padding: 14 }}>
          <div className="row">
            <div style={{ flex: 1 }}>
              <div
                className="muted"
                style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}
              >
                {t.p_threshold}
              </div>
              <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
                {Math.round(threshold * 100)}%
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              style={{ width: 200, accentColor: "var(--ink)" }}
            />
          </div>
        </div>
        <div className="card-flat" style={{ flex: 1, padding: 14 }}>
          <div
            className="muted"
            style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}
          >
            Overall
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, marginTop: 2 }}>
            {Math.round((totalCited / totalAll) * 100)}%
            <span className="muted" style={{ fontSize: 13, fontWeight: 400, marginLeft: 8 }}>
              {totalCited} / {totalAll} claims cited
            </span>
          </div>
        </div>
      </div>

      <div className="section-head">
        <div className="section-title" style={{ fontSize: 14 }}>
          Pages, by claim coverage
        </div>
      </div>
      <div className="list">
        {rows.map((r) => {
          const p = SAMPLE.pages.find((x) => x.id === r.id);
          if (!p) return null;
          const pct = r.cited / r.total;
          const low = pct < threshold;
          return (
            <div
              key={r.id}
              className="list-row"
              style={{ gridTemplateColumns: "20px 1.4fr 2fr auto auto" }}
            >
              <span className="ic">
                <span
                  className={`chip-dot t-${p.type}`}
                  style={{ display: "block" }}
                ></span>
              </span>
              <div>
                <div style={{ fontWeight: 500 }}>{p.title}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {p.type} · updated {p.updated}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div className="cov-bar" style={{ flex: 1 }}>
                  <div
                    className="cov-bar-fill"
                    style={{
                      width: `${pct * 100}%`,
                      background: low ? "var(--c-technique)" : "var(--ink)",
                    }}
                  ></div>
                </div>
                <span
                  className="muted"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 12,
                    minWidth: 56,
                    textAlign: "right",
                  }}
                >
                  {r.cited}/{r.total}
                </span>
              </div>
              <span
                className="chip"
                style={{
                  background: low ? "rgba(220,38,38,0.08)" : "rgba(22,163,74,0.08)",
                  color: low ? "var(--c-technique)" : "var(--c-entity)",
                }}
              >
                {low ? t.p_low : t.p_ok}
              </span>
              <span className="ic">
                <Icon name="chevR" size={12} />
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
