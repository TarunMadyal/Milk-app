"use client";

interface Props {
  value: number;
  onChange: (value: number) => void;
  label?: string; // accessible name, e.g. product name
}

// Big touch-friendly quantity control: − [typable field] +
export default function QtyStepper({ value, onChange, label }: Props) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        disabled={value === 0}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-200 text-3xl font-bold disabled:opacity-40 dark:bg-slate-800"
        aria-label={label ? `Decrease ${label}` : "Decrease"}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={value === 0 ? "" : value}
        placeholder="0"
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const n = Number(e.target.value);
          onChange(Number.isFinite(n) && n > 0 ? n : 0);
        }}
        aria-label={label ? `${label} quantity` : "Quantity"}
        className="h-14 w-16 rounded-2xl border-2 border-slate-300 bg-white text-center text-2xl font-extrabold text-slate-900 outline-none focus:border-brand dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      />
      <button
        onClick={() => onChange(value + 1)}
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand text-3xl font-bold text-white"
        aria-label={label ? `Increase ${label}` : "Increase"}
      >
        +
      </button>
    </div>
  );
}
