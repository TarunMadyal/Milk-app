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

  // Total quantity (and amount) sold per product, for the selected range.
  const productSales = useMemo(() => {
    const totals = new Map<
      string,
      { name: string; qty: number; amount: number }
    >();
    for (const d of scoped) {
      for (const it of d.items) {
        const cur = totals.get(it.productId) ?? {
          name: it.productName,
          qty: 0,
          amount: 0,
        };
        cur.qty += it.quantity;
        cur.amount += it.lineTotal;
        totals.set(it.productId, cur);
      }
    }
    return [...totals.values()].sort((a, b) => b.qty - a.qty);
  }, [scoped]);

  const totalQty = productSales.reduce((s, p) => s + p.qty, 0);
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

      {/* Products sold — total quantity per product for the range */}
      <section>
        <div className="mb-2 flex items-end justify-between">
          <h2 className="text-xl font-bold">📦 Products Sold</h2>
          <span className="text-base font-semibold text-slate-500">
            {totalQty} total
          </span>
        </div>
        {productSales.length === 0 ? (
          <div className="card text-center text-slate-500">
            No products sold {range === "day" ? "today" : `this ${range}`}.
          </div>
        ) : (
          <div className="card divide-y divide-slate-100 dark:divide-slate-800">
            {productSales.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between py-2 first:pt-0 last:pb-0"
              >
                <span className="text-lg font-bold">{p.name}</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-2xl font-extrabold text-brand dark:text-brand-light">
                    {p.qty}
                  </span>
                  <span className="w-20 text-right text-base font-semibold text-slate-500">
                    {rupees(p.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
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
