"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { rupees } from "@/lib/format";

export default function HistoryListPage() {
  const { data, balanceFor, ready } = useStore();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    const list = data.customers.map((c) => ({
      ...c,
      balance: balanceFor(c.id),
    }));
    const q = query.trim().toLowerCase();
    const filtered = q
      ? list.filter((c) => c.name.toLowerCase().includes(q))
      : list;
    // Highest balance first so dues are easy to find.
    return filtered.sort((a, b) => b.balance - a.balance || a.name.localeCompare(b.name));
  }, [data.customers, balanceFor, query]);

  if (!ready) return null;

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">📜 Customers</h1>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="🔍 Search shop..."
        className="field-input"
      />
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id}>
            <Link
              href={`/history/${c.id}`}
              className="card flex items-center justify-between active:scale-[0.99]"
            >
              <span className="flex items-center gap-2 text-xl font-bold">
                {c.name}
                {c.isDealer && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-sm font-bold text-white">
                    Dealer
                  </span>
                )}
              </span>
              <span
                className={`text-xl font-extrabold ${
                  c.balance > 0 ? "text-money-due" : "text-money-paid"
                }`}
              >
                {rupees(c.balance)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
