// Ingest page. Visual prototype only — pipeline runs a mock 5-step animation.
// Real ingestion will spawn the Claude CLI later.

import { useEffect, useState } from "react";
import type { JSX } from "react";
import { Icon } from "../lib/icons";
import type { Strings } from "../lib/i18n";
import { SAMPLE } from "../lib/sample";

export default function PageIngest({ t }: { t: Strings }): JSX.Element {
  const [over, setOver] = useState(false);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [stepIdx, setStepIdx] = useState(-1);
  const steps = [
    t.ing_step_read,
    t.ing_step_summarize,
    t.ing_step_extract,
    t.ing_step_link,
    t.ing_step_lint,
  ];

  useEffect(() => {
    if (!running) return;
    if (stepIdx >= steps.length - 1) {
      const t1 = setTimeout(() => {
        setRunning(false);
        setStepIdx(-1);
      }, 800);
      return () => clearTimeout(t1);
    }
    const t1 = setTimeout(() => setStepIdx((s) => s + 1), 700);
    return () => clearTimeout(t1);
  }, [running, stepIdx, steps.length]);

  const run = (): void => {
    setRunning(true);
    setStepIdx(0);
  };

  return (
    <div className="workspace">
      <header className="page-head">
        <div className="page-eyebrow">{t.nav_ingest}</div>
        <h1 className="page-title">{t.ing_title}</h1>
        <p className="page-lede">{t.ing_lede}</p>
      </header>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 24, marginTop: 16 }}>
        <div className="col">
          <div
            className={"dropzone" + (over ? " over" : "")}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setOver(false);
            }}
          >
            <Icon name="upload" size={26} />
            <div className="dropzone-title">{t.ing_drop}</div>
            <div className="dropzone-sub">PDF · MD · TXT · DOCX — up to 25 MB</div>
            <button className="btn" style={{ marginTop: 14 }}>
              {t.ing_browse}
            </button>
          </div>

          <div className="field">
            <label>URL</label>
            <input className="input" placeholder={t.ing_paste_url_ph} />
          </div>

          <div className="field">
            <label>{t.ing_or_paste}</label>
            <textarea
              className="textarea"
              rows={6}
              placeholder={t.ing_paste_ph}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="row">
            <span className="chip">
              <Icon name="bolt" size={11} /> Claude Sonnet 4.6
            </span>
            <span className="chip">
              <Icon name="globe" size={11} /> Drafts in: 한국어
            </span>
            <button
              className="btn btn-primary"
              style={{ marginLeft: "auto" }}
              onClick={run}
              disabled={running}
            >
              <Icon name="sparkles" size={14} /> {running ? "Running…" : t.ing_run}
            </button>
          </div>
        </div>

        <aside className="col">
          <div className="card">
            <div className="section-title" style={{ fontSize: 13.5, marginBottom: 12 }}>
              {t.ing_pipeline}
            </div>
            <div className="stepper">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className={"step " + (stepIdx > i ? "done" : stepIdx === i ? "active" : "")}
                >
                  <div className="step-bullet">
                    {stepIdx > i ? <Icon name="check" size={11} /> : i + 1}
                  </div>
                  <div className="step-body">
                    <div className="step-title">{s}</div>
                    {i === stepIdx ? <div className="step-sub">working…</div> : null}
                    {i === 2 && stepIdx > 2 ? <div className="step-sub">3 entities · 1 concept</div> : null}
                    {i === 3 && stepIdx > 3 ? <div className="step-sub">7 cross-links written</div> : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-title" style={{ fontSize: 13.5, marginBottom: 8 }}>
              {t.ing_recent}
            </div>
            <div className="list">
              {SAMPLE.history.slice(0, 4).map((h, i) => (
                <div
                  key={i}
                  className="list-row"
                  style={{ gridTemplateColumns: "20px 1fr auto" }}
                >
                  <span className="ic">
                    <Icon name="file" size={13} />
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.source}
                  </span>
                  <span className="meta">{h.date.slice(5)}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
