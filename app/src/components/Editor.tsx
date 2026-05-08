// Editor: CodeMirror 6 with markdown language, no line numbers, soft wrap.
// The component is uncontrolled — it owns the EditorView lifecycle and emits
// onChange on every doc change and onSave when the user explicitly invokes
// Cmd-S. Parent passes initial value via the docKey prop to remount when
// switching files.

import { useEffect, useRef } from "react";
import type { JSX } from "react";
import { EditorState } from "@codemirror/state";
import { EditorView, keymap } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";

export interface EditorProps {
  docKey: string;
  initialValue: string;
  onChange?: (value: string) => void;
  onSave?: (value: string) => void;
}

export default function Editor({
  docKey,
  initialValue,
  onChange,
  onSave,
}: EditorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onChangeRef = useRef(onChange);
  const onSaveRef = useRef(onSave);
  onChangeRef.current = onChange;
  onSaveRef.current = onSave;

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([
          {
            key: "Mod-s",
            run: (view) => {
              onSaveRef.current?.(view.state.doc.toString());
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
          if (update.docChanged) {
            onChangeRef.current?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({ state, parent: containerRef.current });

    return () => {
      view.destroy();
    };
    // We intentionally remount on docKey change rather than diffing doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  return <div ref={containerRef} className="memex-editor" />;
}
