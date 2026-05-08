// Editor: CodeMirror 6 with markdown language, no line numbers, soft wrap.
// The component is uncontrolled — it owns the EditorView lifecycle and emits
// onChange when the document changes. Parent passes initial value via the
// docKey prop to remount when switching files.

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
}

export default function Editor({
  docKey,
  initialValue,
  onChange,
}: EditorProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const state = EditorState.create({
      doc: initialValue,
      extensions: [
        history(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        markdown(),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            onChange?.(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });
    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // We intentionally remount on docKey change rather than diffing doc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  return <div ref={containerRef} className="memex-editor" />;
}
