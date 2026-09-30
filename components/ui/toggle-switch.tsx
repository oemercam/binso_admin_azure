"use client";

import {useLocale} from "@/components/locale-provider";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  showStatus?: boolean;
};

export default function ToggleSwitch({
  checked,
  onChange,
  disabled = false,
  label = "Aktiv",
  showStatus = true,
}: ToggleSwitchProps) {
  const {t}=useLocale();
  const status=t(checked ? "Aktiv" : "Inaktiv");
  return (
    <button
      type="button"
      className={`ui-toggle${checked ? " is-on" : ""}`}
      role="switch"
      aria-checked={checked}
      aria-label={`${t(label)}: ${status}`}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="ui-toggle-track" aria-hidden="true">
        <span className="ui-toggle-thumb" />
      </span>
      {showStatus && <span className="ui-toggle-status">{status}</span>}
    </button>
  );
}
