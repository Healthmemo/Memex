// Editor: CodeMirror 6 with markdown language, no line numbers, soft wrap.
// The component is uncontrolled — it owns the EditorView lifecycle and emits
// onSave for both Cmd/Ctrl-S and idle debounce. Parent passes initial value
// via the docKey prop to remount when switching files.

import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";

const AUTOSAVE_DEBOUNCE_MS = 2000;

export interface EditorProps {
  docKey: string;
  initialValue: string;
  onSave?: (value: string) => void;
}

export default function Editor({
  docKey,
  initialValue,
  onSave,
}: EditorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!containerRef.current) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const flushSave = (doc: string) => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = null;
      onSaveRef.current?.(doc);
    };

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([
          {
            key: "Mod-s",
            run: (view) => {
              flushSave(view.state.doc.toString());
              return true;
            },
            preventDefault: true,
          },
          ...defaultKeymap,
          ...historyKeymap,
        ]),
        markdown(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (!update.docChanged) return;
          if (debounceTimer) clearTimeout(debounceTimer);
          const snapshot = update.state.doc.toString();
          debounceTimer = setTimeout(
            () => flushSave(snapshot),
            AUTOSAVE_DEBOUNCE_MS,
          );
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
        flushSave(view.state.doc.toString());
      }
      view.destroy();
    };
    // We intentionally remount on docKey change rather than diffing doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  return <div ref={containerRef} className="memex-editor" />;
}
