// Graph page — radial layout grouped by type, sample data driven.

import { useMemo, useState } from "react";
import type { JSX } from "react";
import type { Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";
import type { PageType } from "../lib/sample";
import { useUIStore } from "../stores/uiStore";
import type { RouteId } from "../stores/uiStore";

type FilterMap = Record<PageType, boolean>;

export default function PageGraph({ t }: { t: Strings }): JSX.Element {
  const setRoute = useUIStore((s) => s.setRoute);
  const g = SAMPLE.graph;
  const W = 760;
  const H = 480;
  const groupOrder: PageType[] = useMemo(
    () => ["overview", "source", "entity", "concept", "technique", "analysis"],
    [],
  );
  const groups = useMemo(() => {
    const m: Record<string, typeof g.nodes> = {};
    for (const n of g.nodes) {
      (m[n.group] ??= []).push(n);
    }
    return m;
  }, [g]);
  const positions = useMemo(() => {
    const angles: Record<string, number> = {};
    groupOrder.forEach((gn, i) => {
      angles[gn] = (i / 6) * Math.PI * 2;
    });
    const pos: Record<string, { x: number; y: number }> = {};
    for (const [gname, nodes] of Object.entries(groups)) {
      const base = angles[gname] ?? 0;
      nodes.forEach((n, i) => {
        const localR = nodes.length === 1 ? 0 : 80;
        const localA = nodes.length === 1 ? 0 : (i / nodes.length) * Math.PI * 2;
        const cx = W / 2 + Math.cos(base) * 170;
        const cy = H / 2 + Math.sin(base) * 140;
        pos[n.id] = {
          x: cx + Math.cos(localA) * localR,
          y: cy + Math.sin(localA) * localR,
        };
      });
    }
    const ovId = groups.overview?.[0]?.id;
    if (ovId) pos[ovId] = { x: W / 2, y: H / 2 };
    return pos;
  }, [groups, groupOrder]);

  const [hover, setHover] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMap>({
    overview: true,
    source: true,
    entity: true,
    concept: true,
    technique: true,
    analysis: true,
  });

  const visible = (id: string): boolean => {
    const n = g.nodes.find((x) => x.id === id);
    return n ? filter[n.group] : false;
  };

  return (
    <div className="workspace workspace-wide">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_graph}</div>
        <h1 className="page-title">{t.gr_title}</h1>
        <p className="page-lede">{t.gr_lede}</p>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 24, marginTop: 16 }}>
        <div className="card" style={{ padding: 0, overflow: "hidden", background: "var(--bg-soft)" }}>
          <div
            className="row"
            style={{
              padding: "10px 14px",
              borderBottom: "1px solid var(--line)",
              background: "var(--bg)",
            }}
          >
            <span className="chip">
              {g.nodes.length} {t.gr_node_count}
            </span>
            <span className="chip">
              {g.edges.length} {t.gr_edge_count}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: "100%", height: 480, display: "block" }}
          >
            <defs>
              <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.6" fill="var(--ink-5)" opacity="0.4" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="url(#grid)" />
            {g.edges.map(([a, b], i) => {
              if (!visible(a) || !visible(b)) return null;
              const pa = positions[a];
              const pb = positions[b];
              if (!pa || !pb) return null;
              const isHover = hover !== null && (hover === a || hover === b);
              return (
                <line
                  key={i}
                  x1={pa.x}
                  y1={pa.y}
                  x2={pb.x}
                  y2={pb.y}
                  stroke={isHover ? "var(--ink)" : "var(--ink-5)"}
                  strokeWidth={isHover ? 1.4 : 0.8}
                  opacity={hover && !isHover ? 0.25 : 1}
                />
              );
            })}
            {g.nodes.map((n) => {
              if (!filter[n.group]) return null;
              const p = positions[n.id];
              if (!p) return null;
              const r = 4 + n.w * 0.6;
              const isHover = hover === n.id;
              return (
                <g
                  key={n.id}
                  transform={`translate(${p.x},${p.y})`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setHover(n.id)}
                  onMouseLeave={() => setHover(null)}
                  onClick={() => setRoute(`page:sample/${n.id}` as RouteId)}
                >
                  <circle r={r + 4} fill="var(--bg)" />
                  <circle
                    r={r}
                    fill={`var(--c-${n.group})`}
                    stroke={isHover ? "var(--ink)" : "var(--bg)"}
                    strokeWidth={isHover ? 2 : 1.5}
                  />
                  <text
                    x={r + 6}
                    y={3}
                    fontSize="11"
                    fill="var(--ink-2)"
                    style={{ pointerEvents: "none" }}
                  >
                    {n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <aside className="col">
          <div className="card">
            <div className="section-title" style={{ fontSize: 13.5, marginBottom: 10 }}>
              {t.gr_legend}
            </div>
            <div className="col" style={{ gap: 8 }}>
              {groupOrder.map((k) => (
                <button
                  key={k}
                  className="row"
                  style={{
                    cursor: "pointer",
                    gap: 8,
                    background: "transparent",
                    border: 0,
                    padding: 0,
                    width: "100%",
                  }}
                  onClick={() => setFilter({ ...filter, [k]: !filter[k] })}
                >
                  <span className={`switch ${filter[k] ? "on" : ""}`}></span>
                  <span className={`chip-dot t-${k}`} style={{ display: "inline-block" }}></span>
                  <span style={{ textTransform: "capitalize" }}>{k}</span>
                  <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
                    {(groups[k] ?? []).length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ fontSize: 13.5, marginBottom: 8 }}>
              Selection
            </div>
            {hover ? (
              (() => {
                const n = g.nodes.find((x) => x.id === hover);
                if (!n) return null;
                const links = g.edges.filter(([a, b]) => a === hover || b === hover).length;
                return (
                  <div className="col" style={{ gap: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{n.label}</div>
                    <span className="typebadge">
                      <span className={`tb-dot t-${n.group}`}></span>
                      {n.group}
                    </span>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {links} connections
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>
                Hover a node to see details. Click to open.
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
