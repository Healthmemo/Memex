// SettingsPanel: vault path display + change action. Shown as a centered
// modal when settingsOpen is true.

import type { JSX } from "react";
import { useUIStore } from "../stores/uiStore";
import { useVaultStore } from "../stores/vaultStore";
import { ipc } from "../lib/ipc";

export default function SettingsPanel(): JSX.Element | null {
  const open = useUIStore((s) => s.settingsOpen);
  const setOpen = useUIStore((s) => s.setSettingsOpen);
  const currentVault = useVaultStore((s) => s.currentVault);
  const openVault = useVaultStore((s) => s.openVault);

  if (!open) return null;

  async function changeVault() {
    const path = await ipc.pickDirectory();
    if (path) {
      await openVault(path);
      setOpen(false);
    }
  }

  return (
    <div
      className="memex-modal__backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={() => setOpen(false)}
    >
      <div
        className="memex-modal memex-settings"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="memex-modal__title">Settings</h2>
        <section className="memex-settings__row">
          <label>Current vault</label>
          <code className="memex-settings__path">
            {currentVault?.path ?? "(none)"}
          </code>
        </section>
        <div className="memex-modal__actions">
          <button
            type="button"
            className="memex-modal__btn"
            onClick={() => setOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="memex-modal__btn memex-modal__btn--primary"
            onClick={() => void changeVault()}
          >
            Change vault…
          </button>
        </div>
      </div>
    </div>
  );
}
