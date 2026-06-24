"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { rupees, formatDate, formatTime } from "@/lib/format";

export default function CustomerHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const { customerById, deliveriesFor, balanceFor, deleteDelivery, data } =
    useStore();

  const customer = customerById(id);
  const entries = useMemo(() => deliveriesFor(id), [deliveriesFor, id]);
  const balance = balanceFor(id);

  if (!customer) {
    return (
      <div className="space-y-4 pt-10 text-center">
        <p className="text-xl">Shop not found.</p>
        <Link href="/history" className="btn-secondary">
          Back
        </Link>
      </div>
    );
  }

  const waText = encodeURIComponent(
    `*${data.settings.storeName}*\n\n` +
      `Shop: ${customer.name}\n` +
      `*Outstanding Balance: ${rupees(balance)}*`
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-200 text-2xl dark:bg-slate-800"
          aria-label="Back"
        >
          ‹
        </button>
        <h1 className="flex items-center gap-2 text-2xl font-extrabold">
          {customer.name}
          {customer.isDealer && (
            <span className="rounded-full bg-brand px-2 py-0.5 text-sm font-bold text-white">
              Dealer
            </span>
          )}
        </h1>
      </div>

      <div className="card flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-500">
          Outstanding Balance
        </p>
        <p
          className={`text-4xl font-extrabold ${
            balance > 0 ? "text-money-due" : "text-money-paid"
          }`}
        >
          {rupees(balance)}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Link href="/new" className="btn-primary">
          ➕ New
        </Link>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary !border-green-600 !text-green-700"
        >
          🟢 WhatsApp
        </a>
      </div>

      <h2 className="text-xl font-bold">History ({entries.length})</h2>
      {entries.length === 0 ? (
        <div className="card text-center text-lg text-slate-500">
          No entries yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {entries.map((d) => (
            <li key={d.id} className="card space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold">
                  {formatDate(d.date)}{" "}
                  <span className="text-base font-normal text-slate-400">
                    {formatTime(d.date)}
                  </span>
                </span>
                <button
                  onClick={() => {
                    if (confirm("Delete this entry?")) deleteDelivery(d.id);
                  }}
                  className="rounded-lg px-2 py-1 text-base font-bold text-money-due"
                >
                  Delete
                </button>
              </div>

              {d.type === "payment" ? (
                <p className="text-lg font-semibold text-money-paid">
                  💵 Payment received: {rupees(d.amountPaid)}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {d.items.map((it) => (
                    <div
                      key={it.productId}
                      className="flex justify-between text-base"
                    >
                      <span>
                        {it.productName} × {it.quantity}
                      </span>
                      <span className="font-semibold">
                        {rupees(it.lineTotal)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 border-t border-slate-100 pt-1 text-base dark:border-slate-800">
                {d.type === "delivery" && (
                  <span>
                    Total:{" "}
                    <span className="font-bold">{rupees(d.productTotal)}</span>
                  </span>
                )}
                <span>
                  Paid:{" "}
                  <span className="font-bold text-money-paid">
                    {rupees(d.amountPaid)}
                  </span>
                </span>
                <span>
                  Balance:{" "}
                  <span
                    className={`font-bold ${
                      d.newBalance > 0 ? "text-money-due" : "text-money-paid"
                    }`}
                  >
                    {rupees(d.newBalance)}
                  </span>
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
