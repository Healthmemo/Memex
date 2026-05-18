// Graph page — renders the real link graph from vault adjacency using
// Cytoscape.js with the fcose layout. Tag chips (from frontmatter) act as
// filters; clicking a node opens the corresponding file.

import { useEffect, useMemo, useRef, useState } from "react";
import type { JSX } from "react";
import cytoscape from "cytoscape";
import type { ElementDefinition, StylesheetCSS } from "cytoscape";
import fcose from "cytoscape-fcose";
import type { Strings } from "../lib/i18n";
import { useUIStore } from "../stores/uiStore";
import { useVaultStore } from "../stores/vaultStore";

// Obsidian's graph view uses a deliberately monochrome palette: every
// node is the same shade and structure comes from degree-driven sizing
// + a force layout, not from colour. We mirror that.
interface ThemeColors {
  bg: string;
  node: string;
  nodeUnresolved: string;
  ink: string;
  edge: string;
  edgeHi: string;
  accent: string;
}

function readThemeColors(): ThemeColors {
  const root = document.documentElement;
  const cs = getComputedStyle(root);
  const dark = root.getAttribute("data-theme") === "dark";
  return {
    bg: cs.getPropertyValue("--bg").trim() || (dark ? "#0f1115" : "#fafaf9"),
    ink: cs.getPropertyValue("--ink").trim() || (dark ? "#e6e8eb" : "#111418"),
    node: dark ? "#c8c8c8" : "#3a3f47",
    // Wikilinks pointing at pages that don't exist yet — Obsidian
    // greys these out further so unresolved targets are visually quiet.
    nodeUnresolved: dark ? "#6e7079" : "#9aa0a8",
    edge: dark ? "rgba(220, 224, 230, 0.18)" : "rgba(30, 35, 45, 0.16)",
    edgeHi: dark ? "rgba(220, 224, 230, 0.6)" : "rgba(30, 35, 45, 0.5)",
    accent:
      cs.getPropertyValue("--accent").trim() || (dark ? "#7aa7ff" : "#3b82f6"),
  };
}

let layoutRegistered = false;

function ensureLayoutRegistered(): void {
  if (!layoutRegistered) {
    cytoscape.use(fcose);
    layoutRegistered = true;
  }
}

export default function PageGraph({ t }: { t: Strings }): JSX.Element {
  const adjacency = useVaultStore((s) => s.adjacency);
  const currentVault = useVaultStore((s) => s.currentVault);
  const setRoute = useUIStore((s) => s.setRoute);
  const theme = useUIStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<{
    zoomBy: (factor: number) => void;
    fit: () => void;
  } | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [folderFilter, setFolderFilter] = useState<string | null>(null);

  const tags = useMemo(() => collectTags(adjacency?.tags ?? {}), [adjacency]);
  const folders = useMemo(
    () => collectFolders(currentVault?.path ?? "", adjacency),
    [adjacency, currentVault?.path],
  );

  useEffect(() => {
    if (!containerRef.current || !adjacency) return;
    ensureLayoutRegistered();
    const allowed = computeAllowed(adjacency, {
      tagFilter,
      folderFilter,
      vaultRoot: currentVault?.path ?? "",
    });
    const elements = buildElements(adjacency, allowed);
    if (elements.length === 0) {
      containerRef.current.innerHTML = "";
      return;
    }
    const colors = readThemeColors();
    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: makeStyle(colors),
      layout: {
        name: "fcose",
        animate: false,
        randomize: true,
        fit: true,
        padding: 60,
        // Tuned to reproduce Obsidian's hub-and-spoke cluster look —
        // leaves get pushed out into petals, hubs settle into the
        // centre of their cluster, and unrelated clusters drift apart.
        nodeSeparation: 220,
        idealEdgeLength: 90,
        edgeElasticity: 0.1,
        nodeRepulsion: 22000,
        gravity: 0.08,
        gravityRange: 4.5,
        gravityCompound: 1.0,
        nestingFactor: 0.1,
        numIter: 3500,
        tile: false,
      } as unknown as cytoscape.LayoutOptions,
      wheelSensitivity: 0.2,
      minZoom: 0.1,
      maxZoom: 4,
    });

    // Obsidian shows labels only when you zoom past a threshold so the
    // overview stays clean. We reproduce that — labels stay invisible
    // until the user zooms in (or hovers).
    const LABEL_ZOOM_THRESHOLD = 0.9;
    const applyLabelVisibility = (): void => {
      const visible = cy.zoom() >= LABEL_ZOOM_THRESHOLD;
      cy.batch(() => {
        cy.nodes().forEach((n) => {
          if (visible) n.addClass("labels-on");
          else n.removeClass("labels-on");
        });
      });
    };
    cy.on("zoom", applyLabelVisibility);

    const zoomBy = (factor: number): void => {
      const center = {
        x: cy.width() / 2,
        y: cy.height() / 2,
      };
      cy.zoom({ level: cy.zoom() * factor, renderedPosition: center });
    };
    cyRef.current = { zoomBy, fit: () => cy.fit(undefined, 60) };

    cy.on("tap", "node", (event) => {
      const path = event.target.id();
      setRoute(`page:${path}`);
    });

    // Obsidian-style hover: highlight neighbours, dim everything else.
    cy.on("mouseover", "node", (e) => {
      const n = e.target;
      const neighbourhood = n.closedNeighborhood();
      cy.elements().not(neighbourhood).addClass("dimmed");
      neighbourhood.addClass("highlight");
    });
    cy.on("mouseout", "node", () => {
      cy.elements().removeClass("dimmed").removeClass("highlight");
    });

    cy.ready(() => {
      cy.fit(undefined, 60);
      applyLabelVisibility();
    });
    return () => {
      cy.destroy();
    };
  }, [
    adjacency,
    tagFilter,
    folderFilter,
    currentVault?.path,
    setRoute,
    theme,
  ]);

  const nodeCount = adjacency
    ? new Set(
        Object.entries(adjacency.forward).flatMap(([s, ts]) => [s, ...ts]),
      ).size
    : 0;
  const edgeCount = adjacency
    ? Object.values(adjacency.forward).reduce((s, a) => s + a.length, 0)
    : 0;

  return (
    <div className="workspace workspace-wide">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_graph}</div>
        <h1 className="page-title">{t.gr_title}</h1>
        <p className="page-lede">{t.gr_lede}</p>
      </header>
      <div
        className="card"
        style={{
          padding: 0,
          overflow: "hidden",
          background: "var(--bg-soft)",
        }}
      >
        <div
          className="row"
          style={{
            padding: "10px 14px",
            borderBottom: "1px solid var(--line)",
            background: "var(--bg)",
            gap: 8,
            flexWrap: "wrap",
          }}
        >
          <span className="chip">
            {nodeCount} {t.gr_node_count}
          </span>
          <span className="chip">
            {edgeCount} {t.gr_edge_count}
          </span>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            <button
              type="button"
              className={`chip${tagFilter === null ? " chip-active" : ""}`}
              style={chipBtn(tagFilter === null)}
              onClick={() => setTagFilter(null)}
            >
              all tags
            </button>
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                style={chipBtn(tagFilter === tag)}
                onClick={() => setTagFilter(tagFilter === tag ? null : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
          {folders.length > 0 ? (
            <select
              className="pill"
              style={{ marginLeft: "auto" }}
              value={folderFilter ?? ""}
              onChange={(e) => setFolderFilter(e.target.value || null)}
            >
              <option value="">all folders</option>
              {folders.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          ) : null}
          <div
            style={{
              display: "flex",
              gap: 4,
              marginLeft: folders.length > 0 ? 0 : "auto",
            }}
          >
            <button
              type="button"
              style={chipBtn(false)}
              onClick={() => cyRef.current?.zoomBy(0.7)}
              aria-label="Zoom out"
            >
              −
            </button>
            <button
              type="button"
              style={chipBtn(false)}
              onClick={() => cyRef.current?.fit()}
              aria-label="Fit"
            >
              fit
            </button>
            <button
              type="button"
              style={chipBtn(false)}
              onClick={() => cyRef.current?.zoomBy(1.4)}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
        {nodeCount === 0 ? (
          <p className="muted" style={{ padding: 40, textAlign: "center" }}>
            No wikilinks found in the vault yet. Add some{" "}
            <code style={{ fontFamily: "var(--font-mono)" }}>
              [[wikilinks]]
            </code>{" "}
            to see the graph grow.
          </p>
        ) : (
          <div
            ref={containerRef}
            style={{
              height: "calc(100vh - 280px)",
              minHeight: 520,
              width: "100%",
              background: "var(--bg)",
            }}
          />
        )}
      </div>
    </div>
  );
}

function chipBtn(active: boolean): React.CSSProperties {
  return {
    fontSize: 11.5,
    padding: "2px 8px",
    borderRadius: 3,
    background: active ? "var(--ink)" : "var(--bg-soft)",
    color: active ? "var(--bg)" : "var(--ink-3)",
    border: "1px solid var(--line)",
    cursor: "pointer",
  };
}

interface AllowFilterOpts {
  tagFilter: string | null;
  folderFilter: string | null;
  vaultRoot: string;
}

function computeAllowed(
  adjacency: NonNullable<
    ReturnType<typeof useVaultStore.getState>["adjacency"]
  >,
  { tagFilter, folderFilter, vaultRoot }: AllowFilterOpts,
): Set<string> {
  const all = new Set<string>();
  for (const p of Object.keys(adjacency.forward)) all.add(p);
  for (const targets of Object.values(adjacency.forward)) {
    for (const p of targets) all.add(p);
  }
  for (const p of Object.keys(adjacency.tags)) all.add(p);
  return new Set(
    Array.from(all).filter((p) => {
      if (tagFilter && !(adjacency.tags[p] ?? []).includes(tagFilter)) {
        return false;
      }
      if (folderFilter && !inFolder(vaultRoot, p, folderFilter)) {
        return false;
      }
      return true;
    }),
  );
}

function buildElements(
  adjacency: NonNullable<
    ReturnType<typeof useVaultStore.getState>["adjacency"]
  >,
  allowed: Set<string>,
): ElementDefinition[] {
  const nodes = new Set<string>();
  const edges: ElementDefinition[] = [];
  const degree = new Map<string, number>();
  // A node is "resolved" if it appears as a source of any outgoing
  // edge (= we crawled it as a real file). Targets that only appear
  // as wikilink destinations and never as sources are unresolved
  // stubs (Obsidian-style ghost nodes).
  const resolved = new Set<string>(Object.keys(adjacency.forward));
  for (const [source, targets] of Object.entries(adjacency.forward)) {
    if (!allowed.has(source)) continue;
    nodes.add(source);
    for (const target of targets) {
      if (!allowed.has(target)) continue;
      nodes.add(target);
      degree.set(source, (degree.get(source) ?? 0) + 1);
      degree.set(target, (degree.get(target) ?? 0) + 1);
      edges.push({
        data: { id: `${source}::${target}`, source, target },
      });
    }
  }
  return [
    ...Array.from(nodes).map((p) => {
      const deg = degree.get(p) ?? 0;
      // Obsidian-style sizing: dramatic range so hubs visually
      // dominate the way they do in the reference screenshot.
      // Leaves are tiny (6px), big hubs grow up to ~60px.
      const size = Math.max(6, Math.min(60, 6 + Math.sqrt(deg) * 7));
      return {
        data: {
          id: p,
          label: stem(p),
          size,
          unresolved: resolved.has(p) ? 0 : 1,
        },
        classes: resolved.has(p) ? "resolved" : "unresolved",
      };
    }),
    ...edges,
  ];
}

function collectTags(map: Record<string, string[]>): string[] {
  const set = new Set<string>();
  for (const arr of Object.values(map)) {
    for (const tag of arr) set.add(tag);
  }
  return Array.from(set).sort();
}

function collectFolders(
  root: string,
  adjacency: {
    forward: Record<string, string[]>;
    tags: Record<string, string[]>;
  } | null,
): string[] {
  if (!adjacency || !root) return [];
  const trimmed = root.replace(/[\\/]+$/, "");
  const set = new Set<string>();
  const paths = new Set<string>();
  for (const p of Object.keys(adjacency.forward)) paths.add(p);
  for (const arr of Object.values(adjacency.forward)) {
    for (const p of arr) paths.add(p);
  }
  for (const p of Object.keys(adjacency.tags)) paths.add(p);
  for (const p of paths) {
    if (!p.startsWith(trimmed)) continue;
    const rel = p.slice(trimmed.length).replace(/^[\\/]+/, "");
    const idx = rel.indexOf("/");
    if (idx > 0) set.add(rel.slice(0, idx));
  }
  return Array.from(set).sort();
}

function inFolder(root: string, path: string, folder: string): boolean {
  const trimmed = root.replace(/[\\/]+$/, "");
  if (!path.startsWith(trimmed)) return false;
  const rel = path.slice(trimmed.length).replace(/^[\\/]+/, "");
  return rel.startsWith(`${folder}/`) || rel.startsWith(`${folder}\\`);
}

function stem(path: string): string {
  const name = path.split(/[\\/]/).pop() ?? path;
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(0, dot) : name;
}

function makeStyle(c: ThemeColors): StylesheetCSS[] {
  return [
    {
      selector: "node",
      css: {
        "background-color": c.node,
        label: "data(label)",
        color: c.ink,
        "font-size": 10,
        "font-weight": 400,
        "text-valign": "bottom",
        "text-halign": "center",
        "text-margin-y": 4,
        "text-outline-width": 1.5,
        "text-outline-color": c.bg,
        "text-outline-opacity": 1,
        "text-wrap": "ellipsis",
        "text-max-width": "140px",
        // Hide labels by default — zoom listener flips this on/off so
        // a zoomed-out view stays clean like Obsidian's.
        "text-opacity": 0,
        width: "data(size)",
        height: "data(size)",
        "border-width": 0,
        "transition-property": "opacity, text-opacity, border-width",
        "transition-duration": 120,
      },
    },
    {
      selector: "node.unresolved",
      css: {
        "background-color": c.nodeUnresolved,
        "background-opacity": 0.7,
      },
    },
    {
      selector: "edge",
      css: {
        "line-color": c.edge,
        "curve-style": "haystack",
        "haystack-radius": 0,
        width: 0.6,
        "transition-property": "line-color, opacity, width",
        "transition-duration": 120,
      },
    },
    {
      selector: "node.highlight",
      css: {
        "border-width": 2,
        "border-color": c.ink,
        "text-opacity": 1,
        color: c.ink,
      },
    },
    {
      selector: "edge.highlight",
      css: {
        "line-color": c.edgeHi,
        width: 1.2,
      },
    },
    {
      selector: ".dimmed",
      css: {
        opacity: 0.15,
      },
    },
    {
      selector: "node:selected",
      css: {
        "border-width": 2,
        "border-color": c.accent,
        "text-opacity": 1,
      },
    },
    {
      selector: "node.labels-on",
      css: {
        "text-opacity": 1,
      },
    },
  ];
}
