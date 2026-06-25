"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { formatDate, formatTime, isSameDay } from "@/lib/format";
import type { StockItem } from "@/lib/types";
import QtyStepper from "@/components/QtyStepper";

export default function StockPage() {
  const router = useRouter();
  const { data, addStockEntry, deleteStockEntry, ready } = useStore();

  const [qty, setQty] = useState<Record<string, number>>({});
  const [saved, setSaved] = useState(false);

  const today = useMemo(() => new Date(), []);
  const recent = useMemo(
    () =>
      [...data.stockEntries].sort(
        (a, b) => +new Date(b.date) - +new Date(a.date)
      ),
    [data.stockEntries]
  );

  const totalQty = Object.values(qty).reduce((s, q) => s + q, 0);
  const itemCount = Object.values(qty).reduce((s, q) => s + (q > 0 ? 1 : 0), 0);

  // How much was already taken in today (so it's clear at a glance).
  const todayIncoming = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of data.stockEntries) {
      if (!isSameDay(e.date, today)) continue;
      for (const it of e.items) {
        map[it.productId] = (map[it.productId] ?? 0) + it.quantity;
      }
    }
    return map;
  }, [data.stockEntries, today]);

  function setQuantity(id: string, value: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  }

  function handleSave() {
    if (itemCount === 0) return;
    const items: StockItem[] = data.products
      .filter((p) => (qty[p.id] ?? 0) > 0)
      .map((p) => ({
        productId: p.id,
        productName: p.name,
        quantity: qty[p.id],
      }));
    addStockEntry(items);
    setQty({});
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (!ready) return null;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">📥 Incoming Stock</h1>
      <p className="-mt-2 text-base text-slate-500">
        Record how much you took from the source today, before delivery.
      </p>

      {saved && (
        <div className="card bg-money-paid/10 text-center text-lg font-bold text-money-paid">
          ✅ Stock saved!
        </div>
      )}

      {/* Product steppers */}
      <div className="space-y-2">
        {data.products.map((p) => {
          const q = qty[p.id] ?? 0;
          const inToday = todayIncoming[p.id] ?? 0;
          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-2xl p-3 ${
                q > 0
                  ? "bg-brand/10 ring-2 ring-brand"
                  : "bg-white dark:bg-slate-900"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate text-xl font-bold">{p.name}</p>
                {inToday > 0 && (
                  <p className="text-base text-slate-500">
                    Today so far:{" "}
                    <span className="font-bold text-brand dark:text-brand-light">
                      {inToday}
                    </span>
                  </p>
                )}
              </div>
              <QtyStepper
                value={q}
                onChange={(v) => setQuantity(p.id, v)}
                label={p.name}
              />
            </div>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={itemCount === 0}
        className="btn-primary !min-h-[72px] text-2xl"
      >
        💾 Save Incoming
        {totalQty > 0 && (
          <span className="text-lg font-semibold">({totalQty} total)</span>
        )}
      </button>

      <button onClick={() => router.push("/reports")} className="btn-secondary">
        📊 See In / Sold / Left
      </button>

      {/* Recent stock entries */}
      <section>
        <h2 className="mb-2 mt-2 text-xl font-bold">
          Recent Stock ({recent.length})
        </h2>
        {recent.length === 0 ? (
          <div className="card text-center text-lg text-slate-500">
            No stock recorded yet.
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.slice(0, 20).map((e) => (
              <li key={e.id} className="card space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold">
                    {formatDate(e.date)}{" "}
                    <span className="text-base font-normal text-slate-400">
                      {formatTime(e.date)}
                    </span>
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-extrabold text-brand dark:text-brand-light">
                      {e.totalQty}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm("Delete this stock entry?"))
                          deleteStockEntry(e.id);
                      }}
                      className="rounded-lg px-2 py-1 text-base font-bold text-money-due"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-base text-slate-500">
                  {e.items.map((i) => `${i.productName}×${i.quantity}`).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
