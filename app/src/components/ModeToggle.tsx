// Three-way segmented control for editor view mode.

import type { JSX } from "react";
import { useUIStore, type ViewMode } from "../stores/uiStore";

const MODES: readonly { value: ViewMode; label: string }[] = [
  { value: "source", label: "Source" },
  { value: "split", label: "Split" },
  { value: "preview", label: "Preview" },
];

export default function ModeToggle(): JSX.Element {
  const viewMode = useUIStore((s) => s.viewMode);
  const setViewMode = useUIStore((s) => s.setViewMode);

  return (
    <div className="memex-modes" role="tablist" aria-label="Editor view mode">
      {MODES.map(({ value, label }) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={viewMode === value}
          className={`memex-modes__btn${
            viewMode === value ? " memex-modes__btn--active" : ""
          }`}
          onClick={() => setViewMode(value)}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
