"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { rupees, formatTime, isSameDay } from "@/lib/format";

export default function Dashboard() {
  const { data, ready, totalOutstanding } = useStore();

  const today = useMemo(() => new Date(), []);

  const todays = useMemo(
    () =>
      data.deliveries
        .filter((d) => isSameDay(d.date, today))
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [data.deliveries, today]
  );

  const todaySales = todays.reduce((s, d) => s + d.productTotal, 0);
  const todayCollected = todays.reduce((s, d) => s + d.amountPaid, 0);
  const outstanding = totalOutstanding();

  const dateLabel = today.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  if (!ready) return <LoadingScreen />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-extrabold text-brand dark:text-brand-light">
          {data.settings.storeName}
        </h1>
        <p className="text-lg text-slate-500 dark:text-slate-400">{dateLabel}</p>
      </header>

      {/* Big primary action */}
      <Link href="/new" className="btn-primary !min-h-[80px] text-2xl">
        ➕ New Delivery
      </Link>

      <Link href="/stock" className="btn-secondary">
        📥 Incoming Stock
      </Link>

      {/* Today summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card">
          <p className="text-base font-semibold text-slate-500">Today Sales</p>
          <p className="text-3xl font-extrabold text-money-paid">
            {rupees(todaySales)}
          </p>
        </div>
        <div className="card">
          <p className="text-base font-semibold text-slate-500">Today Collected</p>
          <p className="text-3xl font-extrabold text-brand dark:text-brand-light">
            {rupees(todayCollected)}
          </p>
        </div>
      </div>

      <Link href="/reports" className="block">
        <div className="card flex items-center justify-between">
          <div>
            <p className="text-base font-semibold text-slate-500">
              Total Outstanding
            </p>
            <p
              className={`text-4xl font-extrabold ${
                outstanding > 0 ? "text-money-due" : "text-money-paid"
              }`}
            >
              {rupees(outstanding)}
            </p>
          </div>
          <span className="text-3xl">›</span>
        </div>
      </Link>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/pay" className="btn-secondary">
          💵 Mark Paid
        </Link>
        <Link href="/history" className="btn-secondary">
          📜 History
        </Link>
      </div>

      {/* Today's deliveries */}
      <section>
        <h2 className="mb-2 mt-2 text-xl font-bold">
          Today&apos;s Entries ({todays.length})
        </h2>
        {todays.length === 0 ? (
          <div className="card text-center text-lg text-slate-500">
            No deliveries yet today. Tap{" "}
            <span className="font-bold text-brand">➕ New Delivery</span> to
            start.
          </div>
        ) : (
          <ul className="space-y-2">
            {todays.map((d) => (
              <li key={d.id}>
                <Link
                  href={`/history/${d.customerId}`}
                  className="card flex items-center justify-between active:scale-[0.99]"
                >
                  <div>
                    <p className="text-xl font-bold">{d.customerName}</p>
                    <p className="text-base text-slate-500">
                      {d.type === "payment"
                        ? "💵 Payment received"
                        : d.items
                            .map((i) => `${i.productName}×${i.quantity}`)
                            .join(", ")}
                      {"  ·  "}
                      {formatTime(d.date)}
                    </p>
                  </div>
                  <div className="text-right">
                    {d.type === "delivery" && (
                      <p className="text-xl font-bold">{rupees(d.productTotal)}</p>
                    )}
                    {d.amountPaid > 0 && (
                      <p className="text-base font-semibold text-money-paid">
                        Paid {rupees(d.amountPaid)}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex h-[60vh] items-center justify-center text-xl text-slate-400">
      Loading…
    </div>
  );
}
