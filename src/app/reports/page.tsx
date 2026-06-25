"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { rupees } from "@/lib/format";

type Range = "day" | "week" | "month";

function inRange(iso: string, range: Range): boolean {
  const d = new Date(iso);
  const now = new Date();
  if (range === "day") {
    return (
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate()
    );
  }
  if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(now.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);
    return d >= weekAgo;
  }
  // month
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}

export default function ReportsPage() {
  const { data, balanceFor, totalOutstanding } = useStore();
  const [range, setRange] = useState<Range>("day");

  const scoped = useMemo(
    () => data.deliveries.filter((d) => inRange(d.date, range)),
    [data.deliveries, range]
  );

  const sales = scoped.reduce((s, d) => s + d.productTotal, 0);
  const collected = scoped.reduce((s, d) => s + d.amountPaid, 0);
  const outstanding = totalOutstanding();

  const topCustomers = useMemo(() => {
    const totals = new Map<string, { name: string; total: number }>();
    for (const d of data.deliveries) {
      const cur = totals.get(d.customerId) ?? {
        name: d.customerName,
        total: 0,
      };
      cur.total += d.productTotal;
      totals.set(d.customerId, cur);
    }
    return [...totals.values()]
      .filter((t) => t.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [data.deliveries]);

  const topDue = useMemo(() => {
    return data.customers
      .map((c) => ({ name: c.name, id: c.id, balance: balanceFor(c.id) }))
      .filter((c) => c.balance > 0)
      .sort((a, b) => b.balance - a.balance)
      .slice(0, 5);
  }, [data.customers, balanceFor]);

  const scopedStock = useMemo(
    () => data.stockEntries.filter((e) => inRange(e.date, range)),
    [data.stockEntries, range]
  );

  // Per product for the selected range: incoming (taken from source),
  // sold (delivered), and left (incoming − sold).
  const productRows = useMemo(() => {
    const map = new Map<
      string,
      { name: string; incoming: number; sold: number; amount: number }
    >();
    const get = (id: string, name: string) => {
      let cur = map.get(id);
      if (!cur) {
        cur = { name, incoming: 0, sold: 0, amount: 0 };
        map.set(id, cur);
      }
      return cur;
    };
    for (const e of scopedStock) {
      for (const it of e.items) get(it.productId, it.productName).incoming += it.quantity;
    }
    for (const d of scoped) {
      for (const it of d.items) {
        const row = get(it.productId, it.productName);
        row.sold += it.quantity;
        row.amount += it.lineTotal;
      }
    }
    return [...map.values()]
      .map((r) => ({ ...r, left: r.incoming - r.sold }))
      .sort((a, b) => b.sold - a.sold || b.incoming - a.incoming);
  }, [scoped, scopedStock]);

  const totalIn = productRows.reduce((s, p) => s + p.incoming, 0);
  const totalSold = productRows.reduce((s, p) => s + p.sold, 0);
  const maxTop = topCustomers[0]?.total ?? 1;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">📊 Reports</h1>

      {/* Range toggle */}
      <div className="grid grid-cols-3 gap-2">
        {(["day", "week", "month"] as Range[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`min-h-[56px] rounded-2xl text-lg font-bold ${
              range === r
                ? "bg-brand text-white"
                : "bg-white text-slate-600 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            {r === "day" ? "Today" : r === "week" ? "Week" : "Month"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-base font-semibold text-slate-500">Sales</p>
          <p className="text-3xl font-extrabold text-money-paid">
            {rupees(sales)}
          </p>
        </div>
        <div className="card">
          <p className="text-base font-semibold text-slate-500">Collected</p>
          <p className="text-3xl font-extrabold text-brand dark:text-brand-light">
            {rupees(collected)}
          </p>
        </div>
      </div>

      <div className="card">
        <p className="text-base font-semibold text-slate-500">
          Total Outstanding (all time)
        </p>
        <p className="text-4xl font-extrabold text-money-due">
          {rupees(outstanding)}
        </p>
      </div>

      {/* Per-product stock: Incoming (from source) vs Sold vs Left */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-xl font-bold">📦 Products: In / Sold / Left</h2>
        </div>
        {productRows.length === 0 ? (
          <div className="card text-center text-slate-500">
            No stock or sales {range === "day" ? "today" : `this ${range}`}.
          </div>
        ) : (
          <div className="card">
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-b border-slate-200 pb-1 text-sm font-bold text-slate-500 dark:border-slate-700">
              <span>Product</span>
              <span className="w-12 text-right">In</span>
              <span className="w-12 text-right">Sold</span>
              <span className="w-12 text-right">Left</span>
            </div>
            {productRows.map((p) => (
              <div
                key={p.name}
                className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 py-2 text-lg"
              >
                <span className="truncate font-bold">{p.name}</span>
                <span className="w-12 text-right font-semibold text-slate-500">
                  {p.incoming}
                </span>
                <span className="w-12 text-right font-extrabold text-brand dark:text-brand-light">
                  {p.sold}
                </span>
                <span
                  className={`w-12 text-right font-extrabold ${
                    p.left < 0 ? "text-money-due" : "text-money-paid"
                  }`}
                >
                  {p.left}
                </span>
              </div>
            ))}
            <div className="grid grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border-t border-slate-200 pt-1 text-base font-bold dark:border-slate-700">
              <span>Total</span>
              <span className="w-12 text-right">{totalIn}</span>
              <span className="w-12 text-right">{totalSold}</span>
              <span className="w-12 text-right">{totalIn - totalSold}</span>
            </div>
          </div>
        )}
        <p className="mt-1 px-1 text-sm text-slate-400">
          In = taken from source · Sold = delivered · Left = remaining stock.
        </p>
      </section>

      {/* Top customers */}
      <section>
        <h2 className="mb-2 text-xl font-bold">🏆 Top Customers</h2>
        {topCustomers.length === 0 ? (
          <div className="card text-center text-slate-500">No sales yet.</div>
        ) : (
          <div className="card space-y-3">
            {topCustomers.map((c, i) => (
              <div key={c.name}>
                <div className="flex justify-between text-lg font-bold">
                  <span>
                    {i + 1}. {c.name}
                  </span>
                  <span>{rupees(c.total)}</span>
                </div>
                <div className="mt-1 h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className="h-3 rounded-full bg-brand"
                    style={{ width: `${(c.total / maxTop) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Pending collection */}
      <section>
        <h2 className="mb-2 text-xl font-bold">🔴 Highest Pending</h2>
        {topDue.length === 0 ? (
          <div className="card text-center text-slate-500">
            No pending balances. 🎉
          </div>
        ) : (
          <ul className="space-y-2">
            {topDue.map((c) => (
              <li key={c.id}>
                <Link
                  href={`/history/${c.id}`}
                  className="card flex items-center justify-between active:scale-[0.99]"
                >
                  <span className="text-lg font-bold">{c.name}</span>
                  <span className="text-xl font-extrabold text-money-due">
                    {rupees(c.balance)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
