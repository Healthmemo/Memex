// DialogHost renders the active prompt/confirm modal from dialogStore.
// Mount it once near the root of the app.

import { useEffect, useRef, useState } from "react";
import type { JSX } from "react";
import { useDialogStore } from "../stores/dialogStore";

export default function DialogHost(): JSX.Element | null {
  const request = useDialogStore((s) => s.request);
  const close = useDialogStore((s) => s.close);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!request) return;
    setValue(request.defaultValue ?? "");
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
  }, [request]);

  if (!request) return null;

  function submit() {
    if (!request) return;
    if (request.kind === "prompt") {
      const trimmed = value.trim();
      close(trimmed.length > 0 ? trimmed : null);
    } else {
      close("ok");
    }
  }

  return (
    <div
      className="memex-modal__backdrop"
      role="dialog"
      aria-modal="true"
      onClick={() => close(null)}
      onKeyDown={(e) => {
        if (e.key === "Escape") close(null);
      }}
    >
      <div
        className="memex-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="memex-modal__title">{request.title}</h2>
        {request.message ? (
          <p className="memex-modal__message">{request.message}</p>
        ) : null}
        {request.kind === "prompt" ? (
          <input
            ref={inputRef}
            type="text"
            className="memex-modal__input"
            value={value}
            placeholder={request.placeholder}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") close(null);
            }}
          />
        ) : null}
        <div className="memex-modal__actions">
          <button
            type="button"
            className="memex-modal__btn"
            onClick={() => close(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={`memex-modal__btn memex-modal__btn--primary${
              request.danger ? " memex-modal__btn--danger" : ""
            }`}
            onClick={submit}
          >
            {request.kind === "confirm"
              ? request.danger
                ? "Delete"
                : "OK"
              : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
