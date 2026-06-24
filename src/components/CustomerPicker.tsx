"use client";

import { useMemo, useState } from "react";
import type { Customer } from "@/lib/types";

interface Props {
  customers: Customer[];
  onPick: (c: Customer) => void;
  onClose: () => void;
  balanceFor?: (id: string) => number;
}

export default function CustomerPicker({
  customers,
  onPick,
  onClose,
  balanceFor,
}: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = [...customers].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter((c) => c.name.toLowerCase().includes(q));
  }, [customers, query]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black/40">
      <div className="mx-auto flex h-[100dvh] w-full max-w-md flex-col bg-white dark:bg-slate-950">
        <div className="flex items-center gap-2 border-b border-slate-200 p-3 dark:border-slate-800">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍 Search shop..."
            className="field-input flex-1"
          />
          <button
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-2xl dark:bg-slate-800"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <ul className="flex-1 overflow-y-auto p-2">
          {filtered.map((c) => {
            const bal = balanceFor ? balanceFor(c.id) : null;
            return (
              <li key={c.id}>
                <button
                  onClick={() => onPick(c)}
                  className="mb-2 flex min-h-touch w-full items-center justify-between rounded-2xl bg-slate-100 px-4 py-3 text-left active:scale-[0.99] dark:bg-slate-900"
                >
                  <span className="flex items-center gap-2 text-xl font-bold">
                    {c.name}
                    {c.isDealer && (
                      <span className="rounded-full bg-brand px-2 py-0.5 text-sm font-bold text-white">
                        Dealer
                      </span>
                    )}
                  </span>
                  {bal !== null && bal > 0 && (
                    <span className="text-lg font-bold text-money-due">
                      ₹{Math.round(bal)}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <p className="p-6 text-center text-lg text-slate-500">
              No shop found.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
}
