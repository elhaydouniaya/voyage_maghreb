"use client";

type SwitchProps = {
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
  /** id of the element labelling this switch, for screen readers */
  labelledBy?: string;
  /** accessible name when there is no visible label element */
  label?: string;
};

/**
 * Accessible on/off toggle (role="switch") styled to the app's navy/orange
 * theme. Controlled — the parent owns the boolean.
 */
export default function Switch({
  checked,
  onChange,
  disabled = false,
  labelledBy,
  label,
}: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-orange-600" : "bg-gray-200"
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}