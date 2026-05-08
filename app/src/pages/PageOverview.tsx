// Overview page — hero, stats, quick links, recent activity. Sample data
// stays in for stats/recent until we wire backend metrics.

import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";
import { useUIStore } from "../stores/uiStore";

export default function PageOverview({ t }: { t: Strings }): JSX.Element {
  const setRoute = useUIStore((s) => s.setRoute);
  const S = SAMPLE;
  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.ov_eyebrow}</div>
        <h1 className="page-title">{t.ov_title}</h1>
        <p className="page-lede">{t.ov_lede}</p>
        <div className="row" style={{ marginTop: 24 }}>
          <button className="btn btn-primary" onClick={() => setRoute("ingest")}>
            <Icon name="upload" size={14} /> {t.ov_cta_ingest}
          </button>
          <button className="btn" onClick={() => setRoute("query")}>
            <Icon name="msg" size={14} /> {t.ov_cta_ask}
          </button>
        </div>
      </header>

      <div className="stat-strip">
        <Stat label={t.ov_stats_pages} value={String(S.stats.pages)} sub="+ 4 this week" />
        <Stat label={t.ov_stats_sources} value={String(S.stats.sources)} sub={`last on ${S.stats.lastUpdated}`} />
        <Stat label={t.ov_stats_links} value={String(S.stats.links)} sub="3.4 avg per page" />
        <Stat label={t.ov_stats_ratio} value={`${Math.round(S.stats.wikiRatio * 100)}%`} sub="target ≥ 70%" />
      </div>

      <div className="section-head">
        <div className="section-title">{t.ov_quick}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {(["bpe", "gpt-1", "llm-pipeline"] as const).map((id) => {
          const p = S.pages.find((x) => x.id === id);
          if (!p) return null;
          return (
            <button
              key={id}
              className="card"
              style={{ textAlign: "left", cursor: "pointer" }}
              onClick={() => setRoute(`page:sample/${id}`)}
            >
              <div className="row" style={{ marginBottom: 8 }}>
                <span className="typebadge">
                  <span className={`tb-dot t-${p.type}`}></span>
                  {p.type}
                </span>
                <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
                  {p.updated}
                </span>
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, letterSpacing: "-0.01em" }}>{p.title}</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                {p.sources} sources · {p.links} links · {p.words} words
              </div>
            </button>
          );
        })}
      </div>

      <div className="section-head">
        <div className="section-title">{t.ov_recent}</div>
        <button
          className="section-action"
          onClick={() => setRoute("history")}
          style={{ background: "transparent", border: 0 }}
        >
          {t.ov_recent_more} →
        </button>
      </div>
      <div className="list">
        {S.recentLog.map((r, i) => (
          <div key={i} className="list-row">
            <span className="ic">
              <Icon
                name={r.action === "ingest" ? "upload" : r.action === "query" ? "msg" : r.action === "lint" ? "check" : "spark"}
                size={14}
              />
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontWeight: 500 }}>{r.title}</span>
              <span className="pill-mini">{r.action}</span>
            </span>
            <span className="meta">{r.date}</span>
            <span className="ic">
              <Icon name="chevR" size={12} />
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }): JSX.Element {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-sub">{sub}</div>
    </div>
  );
}
