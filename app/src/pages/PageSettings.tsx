// Settings page — sub-tabs: Account, Model, Connections, Language,
// Appearance, About. Most settings are local UI state for the prototype.

import { useState } from "react";
import type { JSX } from "react";
import { Icon, ProviderGlyph } from "../lib/icons";
import type { IconName, ProviderId } from "../lib/icons";
import type { Lang, Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";
import type { SampleProvider } from "../lib/sample";
import { useUIStore } from "../stores/uiStore";
import type { Theme } from "../stores/uiStore";
import { useVaultStore } from "../stores/vaultStore";
import { ipc } from "../lib/ipc";

export default function PageSettings({ t }: { t: Strings }): JSX.Element {
  const lang = useUIStore((s) => s.lang);
  const setLang = useUIStore((s) => s.setLang);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);

  const [tab, setTab] = useState<
    "account" | "model" | "providers" | "lang" | "appearance" | "about"
  >("model");
  const [model, setModel] = useState({
    ingest: "claude-sonnet-4-6",
    query: "claude-sonnet-4-6",
  });
  const [providers, setProviders] = useState<SampleProvider[]>(SAMPLE.providers);

  const tabs: { id: typeof tab; label: string; icon: IconName }[] = [
    { id: "account", label: t.s_account, icon: "shield" },
    { id: "model", label: t.s_model, icon: "sparkles" },
    { id: "providers", label: t.s_providers, icon: "link" },
    { id: "lang", label: t.s_lang, icon: "globe" },
    { id: "appearance", label: t.s_appearance, icon: "moon" },
    { id: "about", label: t.s_about, icon: "info" },
  ];
  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_settings}</div>
        <h1 className="page-title">{t.s_title}</h1>
      </header>
      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 32, marginTop: 16 }}>
        <nav className="col" style={{ gap: 1 }}>
          {tabs.map((x) => (
            <button
              key={x.id}
              className={"qbtn" + (tab === x.id ? " active" : "")}
              onClick={() => setTab(x.id)}
            >
              <span className="qicon">
                <Icon name={x.icon} size={14} />
              </span>
              <span>{x.label}</span>
            </button>
          ))}
        </nav>
        <div>
          {tab === "account" ? <SettingsAccount t={t} /> : null}
          {tab === "model" ? (
            <SettingsModel t={t} model={model} setModel={setModel} />
          ) : null}
          {tab === "providers" ? (
            <SettingsProviders
              t={t}
              providers={providers}
              setProviders={setProviders}
            />
          ) : null}
          {tab === "lang" ? <SettingsLang t={t} lang={lang} setLang={setLang} /> : null}
          {tab === "appearance" ? (
            <SettingsAppearance t={t} theme={theme} setTheme={setTheme} />
          ) : null}
          {tab === "about" ? <SettingsAbout t={t} /> : null}
        </div>
      </div>
    </div>
  );
}

function SettingsAccount({ t }: { t: Strings }): JSX.Element {
  const currentVault = useVaultStore((s) => s.currentVault);
  const openVault = useVaultStore((s) => s.openVault);
  return (
    <div className="col" style={{ gap: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.s_account}</h2>
      <div className="card row" style={{ gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "var(--ink)",
            color: "var(--bg)",
            display: "grid",
            placeItems: "center",
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          M
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>Local user</div>
          <div className="muted" style={{ fontSize: 13 }}>
            {currentVault?.path ?? "no vault"} · Memex
          </div>
        </div>
      </div>
      <div className="field">
        <label>Workspace name</label>
        <input className="input" defaultValue={currentVault?.name ?? ""} />
      </div>
      <div className="field">
        <label>Vault path</label>
        <div className="row">
          <input
            className="input"
            style={{ fontFamily: "var(--font-mono)", fontSize: 13, flex: 1 }}
            value={currentVault?.path ?? ""}
            readOnly
          />
          <button
            className="btn"
            onClick={async () => {
              const p = await ipc.pickDirectory();
              if (p) await openVault(p);
            }}
          >
            Change…
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsModel({
  t,
  model,
  setModel,
}: {
  t: Strings;
  model: { ingest: string; query: string };
  setModel: (m: { ingest: string; query: string }) => void;
}): JSX.Element {
  const M = SAMPLE.models;
  function Card({
    task,
    current,
    onPick,
  }: {
    task: string;
    current: string;
    onPick: (id: string) => void;
  }): JSX.Element {
    return (
      <div className="card">
        <div className="row" style={{ marginBottom: 12 }}>
          <div style={{ fontWeight: 600 }}>{task}</div>
          <span className="muted" style={{ marginLeft: "auto", fontSize: 12 }}>
            active: {M.find((m) => m.id === current)?.name}
          </span>
        </div>
        <div className="col" style={{ gap: 6 }}>
          {M.map((m) => {
            const sel = m.id === current;
            return (
              <button
                key={m.id}
                className="card-flat"
                style={{
                  padding: 12,
                  border: `1px solid ${sel ? "var(--ink)" : "transparent"}`,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  textAlign: "left",
                  cursor: "pointer",
                  background: sel ? "var(--bg)" : "var(--bg-soft)",
                }}
                onClick={() => onPick(m.id)}
              >
                <span
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    background: "var(--bg)",
                    border: "1px solid var(--line)",
                    display: "grid",
                    placeItems: "center",
                    color: "var(--ink-2)",
                  }}
                >
                  <ProviderGlyph
                    id={
                      (m.provider === "anthropic"
                        ? "anthropic-cli"
                        : m.provider === "openai"
                          ? "openai-api"
                          : m.provider === "google"
                            ? "google-api"
                            : m.provider === "ollama"
                              ? "ollama"
                              : "openrouter") as ProviderId
                    }
                    size={16}
                  />
                </span>
                <div>
                  <div className="row" style={{ gap: 6 }}>
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    {m.recommended ? (
                      <span
                        className="chip"
                        style={{ background: "var(--ink)", color: "var(--bg)" }}
                      >
                        {t.s_model_recommended}
                      </span>
                    ) : null}
                  </div>
                  <div className="muted" style={{ fontSize: 12.5, marginTop: 2 }}>
                    {m.desc} · {m.ctx} {t.s_model_ctx} · {m.speed}
                  </div>
                </div>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `1.5px solid ${sel ? "var(--ink)" : "var(--line-strong)"}`,
                    background: sel ? "var(--ink)" : "transparent",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {sel ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: "var(--bg)",
                        borderRadius: "50%",
                      }}
                    ></span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }
  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.s_model}</h2>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          {t.s_model_lede}
        </p>
      </div>
      <Card
        task={t.s_model_ingest}
        current={model.ingest}
        onPick={(id) => setModel({ ...model, ingest: id })}
      />
      <Card
        task={t.s_model_query}
        current={model.query}
        onPick={(id) => setModel({ ...model, query: id })}
      />
    </div>
  );
}

function SettingsProviders({
  t,
  providers,
  setProviders,
}: {
  t: Strings;
  providers: SampleProvider[];
  setProviders: (p: SampleProvider[]) => void;
}): JSX.Element {
  const [keyOpen, setKeyOpen] = useState<string | null>(null);
  const [keyVal, setKeyVal] = useState("");

  function toggle(id: string): void {
    const p = providers.find((x) => x.id === id);
    if (!p) return;
    if (p.connected) {
      setProviders(
        providers.map((x) => (x.id === id ? { ...x, connected: false } : x)),
      );
    } else if (p.kind === "api") {
      setKeyOpen(id);
      setKeyVal("");
    } else {
      setProviders(
        providers.map((x) => (x.id === id ? { ...x, connected: true } : x)),
      );
    }
  }

  function saveKey(): void {
    setProviders(
      providers.map((x) =>
        x.id === keyOpen ? { ...x, connected: true, lastCheck: "just now" } : x,
      ),
    );
    setKeyOpen(null);
  }

  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.s_providers}</h2>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          {t.s_providers_lede}
        </p>
      </div>
      <div className="col" style={{ gap: 10 }}>
        {providers.map((p) => (
          <div
            key={p.id}
            className="card"
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 14,
              alignItems: "center",
              padding: 14,
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "var(--bg-soft)",
                border: "1px solid var(--line)",
                display: "grid",
                placeItems: "center",
                color: "var(--ink-2)",
              }}
            >
              <ProviderGlyph id={p.id as ProviderId} size={18} />
            </span>
            <div>
              <div className="row" style={{ gap: 8 }}>
                <span style={{ fontWeight: 600 }}>{p.name}</span>
                <span className="chip" style={{ background: "var(--bg-soft)" }}>
                  {p.kind}
                </span>
                {p.connected ? (
                  <span
                    className="chip"
                    style={{ background: "rgba(22,163,74,0.1)", color: "var(--c-entity)" }}
                  >
                    ● {t.s_provider_connected}
                  </span>
                ) : (
                  <span className="chip">○ {t.s_provider_disconnected}</span>
                )}
                {p.connected && p.lastCheck ? (
                  <span className="muted" style={{ fontSize: 12 }}>
                    checked {p.lastCheck}
                  </span>
                ) : null}
              </div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                {p.desc}
              </div>
              {keyOpen === p.id ? (
                <div className="row" style={{ marginTop: 10, gap: 8 }}>
                  <Icon name="key" size={14} />
                  <input
                    className="input"
                    placeholder={
                      p.id.startsWith("anthropic")
                        ? "sk-ant-…"
                        : p.id.startsWith("openai")
                          ? "sk-…"
                          : "Paste API key"
                    }
                    value={keyVal}
                    onChange={(e) => setKeyVal(e.target.value)}
                    style={{ flex: 1, fontFamily: "var(--font-mono)", fontSize: 13 }}
                  />
                  <button
                    className="btn btn-primary"
                    onClick={saveKey}
                    disabled={!keyVal.trim()}
                  >
                    Save
                  </button>
                  <button className="btn-ghost btn" onClick={() => setKeyOpen(null)}>
                    Cancel
                  </button>
                </div>
              ) : null}
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              {p.connected ? (
                <button className="btn-ghost btn">{t.s_provider_test}</button>
              ) : null}
              <button
                className={"btn" + (p.connected ? "" : " btn-primary")}
                onClick={() => toggle(p.id)}
              >
                {p.connected ? t.s_provider_disconnect : t.s_provider_connect}
              </button>
            </div>
          </div>
        ))}
      </div>
      <div
        className="card-flat"
        style={{ display: "flex", gap: 12, alignItems: "flex-start", marginTop: 4 }}
      >
        <Icon name="terminal" size={16} />
        <div style={{ fontSize: 13.5, color: "var(--ink-3)" }}>
          The <b style={{ color: "var(--ink)" }}>Claude Code CLI</b> connection uses your existing
          subscription — no API key needed. Memex shells out to{" "}
          <code style={{ fontFamily: "var(--font-mono)" }}>claude</code> on your machine.
        </div>
      </div>
    </div>
  );
}

function SettingsLang({
  t,
  lang,
  setLang,
}: {
  t: Strings;
  lang: Lang;
  setLang: (l: Lang) => void;
}): JSX.Element {
  const [draftLang, setDraftLang] = useState<Lang | "auto">(lang);
  const opts: { id: Lang; name: string; native: string }[] = [
    { id: "en", name: "English", native: "English" },
    { id: "ko", name: "Korean", native: "한국어" },
    { id: "ja", name: "Japanese", native: "日本語" },
  ];
  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.s_lang}</h2>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          {t.s_lang_lede}
        </p>
      </div>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 10 }}>{t.s_lang_ui}</div>
        <div className="col" style={{ gap: 6 }}>
          {opts.map((o) => {
            const sel = lang === o.id;
            return (
              <button
                key={o.id}
                className="card-flat"
                style={{
                  padding: 12,
                  border: `1px solid ${sel ? "var(--ink)" : "transparent"}`,
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: 12,
                  alignItems: "center",
                  textAlign: "left",
                  cursor: "pointer",
                  background: sel ? "var(--bg)" : "var(--bg-soft)",
                }}
                onClick={() => setLang(o.id)}
              >
                <span
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: "var(--ink)",
                    width: 28,
                    textAlign: "center",
                  }}
                >
                  {o.id === "en" ? "Aa" : o.id === "ko" ? "가" : "あ"}
                </span>
                <div>
                  <div style={{ fontWeight: 500 }}>{o.native}</div>
                  <div className="muted" style={{ fontSize: 12.5 }}>
                    {o.name}
                  </div>
                </div>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    border: `1.5px solid ${sel ? "var(--ink)" : "var(--line-strong)"}`,
                    background: sel ? "var(--ink)" : "transparent",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  {sel ? (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        background: "var(--bg)",
                        borderRadius: "50%",
                      }}
                    ></span>
                  ) : null}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="card">
        <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.s_lang_drafts}</div>
        <p className="muted" style={{ fontSize: 13, margin: "0 0 10px" }}>
          Claude will write source pages, summaries and answers in this language.
        </p>
        <div className="segmented" style={{ width: "fit-content" }}>
          {opts.map((o) => (
            <button
              key={o.id}
              className={draftLang === o.id ? "active" : ""}
              onClick={() => setDraftLang(o.id)}
            >
              {o.native}
            </button>
          ))}
          <button
            onClick={() => setDraftLang("auto")}
            className={draftLang === "auto" ? "active" : ""}
          >
            Auto
          </button>
        </div>
      </div>
    </div>
  );
}

function SettingsAppearance({
  t,
  theme,
  setTheme,
}: {
  t: Strings;
  theme: Theme;
  setTheme: (th: Theme) => void;
}): JSX.Element {
  const opts: { id: Theme; label: string; icon: IconName }[] = [
    { id: "light", label: t.s_appearance_light, icon: "sun" },
    { id: "dark", label: t.s_appearance_dark, icon: "moon" },
    { id: "system", label: t.s_appearance_system, icon: "cloud" },
  ];
  return (
    <div className="col" style={{ gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.s_appearance}</h2>
        <p className="muted" style={{ margin: "6px 0 0", fontSize: 14 }}>
          {t.s_appearance_lede}
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {opts.map((o) => {
          const sel = theme === o.id;
          const isDark = o.id === "dark";
          return (
            <button
              key={o.id}
              className="card"
              style={{
                padding: 0,
                overflow: "hidden",
                textAlign: "left",
                cursor: "pointer",
                border: `1px solid ${sel ? "var(--ink)" : "var(--line)"}`,
              }}
              onClick={() => setTheme(o.id)}
            >
              <div
                style={{
                  height: 92,
                  background: isDark
                    ? "#191919"
                    : "linear-gradient(135deg, #fbfbfa, #efeeec)",
                  padding: 12,
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "70%",
                    height: 8,
                    background: isDark ? "#2c2c2c" : "#e9e8e4",
                    borderRadius: 4,
                  }}
                ></div>
                <div
                  style={{
                    width: "55%",
                    height: 8,
                    background: isDark ? "#2c2c2c" : "#e9e8e4",
                    borderRadius: 4,
                    marginTop: 6,
                  }}
                ></div>
                <div
                  style={{
                    width: 40,
                    height: 8,
                    background: isDark ? "#ededec" : "#181715",
                    borderRadius: 4,
                    marginTop: 14,
                  }}
                ></div>
                <div style={{ position: "absolute", top: 10, right: 10 }}>
                  <Icon name={o.icon} size={16} />
                </div>
              </div>
              <div
                style={{
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: `1.5px solid ${sel ? "var(--ink)" : "var(--line-strong)"}`,
                    background: sel ? "var(--ink)" : "transparent",
                  }}
                ></span>
                <span style={{ fontWeight: 500 }}>{o.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SettingsAbout({ t }: { t: Strings }): JSX.Element {
  return (
    <div className="col" style={{ gap: 20 }}>
      <h2 style={{ fontSize: 22, fontWeight: 600, margin: 0 }}>{t.s_about}</h2>
      <div className="card" style={{ padding: 24, display: "flex", gap: 18, alignItems: "center" }}>
        <span style={{ width: 64, height: 64, color: "var(--ink)", display: "block" }}>
          {/* Inline mark to avoid extra import */}
          <svg width="64" height="64" viewBox="0 0 240 240">
            <g fill="currentColor">
              <rect x="70" y="40" width="20" height="40" />
              <rect x="150" y="40" width="20" height="40" />
              <rect x="60" y="80" width="120" height="10" />
              <rect x="50" y="90" width="140" height="60" />
              <rect x="30" y="110" width="20" height="20" />
              <rect x="190" y="110" width="20" height="20" />
              <rect x="70" y="150" width="30" height="40" />
              <rect x="140" y="150" width="30" height="40" />
            </g>
            <rect x="80" y="110" width="20" height="20" fill="var(--bg)" />
            <rect x="140" y="110" width="20" height="20" fill="var(--bg)" />
          </svg>
        </span>
        <div>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>Memex</div>
          <div className="muted" style={{ fontSize: 13 }}>
            v0.2.0 · build 2026.05.09
          </div>
          <p style={{ fontSize: 14, marginTop: 8, color: "var(--ink-2)", maxWidth: 520 }}>
            {t.s_about_built}
          </p>
        </div>
      </div>
    </div>
  );
}
