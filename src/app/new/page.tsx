"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { priceFor } from "@/lib/pricing";
import { rupees, plainNumber } from "@/lib/format";
import type { Customer, DeliveryItem } from "@/lib/types";
import CustomerPicker from "@/components/CustomerPicker";
import QtyStepper from "@/components/QtyStepper";

export default function NewDeliveryPage() {
  const router = useRouter();
  const {
    data,
    balanceFor,
    lastDeliveryFor,
    addDelivery,
    customerById,
  } = useStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [qty, setQty] = useState<Record<string, number>>({});
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [saved, setSaved] = useState<null | {
    name: string;
    total: number;
    paid: number;
    newBalance: number;
    lines: string;
  }>(null);

  const previousBalance = customer ? balanceFor(customer.id) : 0;

  const productTotal = useMemo(() => {
    if (!customer) return 0;
    return data.products.reduce((sum, p) => {
      const q = qty[p.id] ?? 0;
      return sum + q * priceFor(p, customer);
    }, 0);
  }, [data.products, qty, customer]);

  const paidNum = parseFloat(amountPaid) || 0;
  const newBalance = previousBalance + productTotal - paidNum;
  const itemCount = Object.values(qty).reduce((s, q) => s + (q > 0 ? 1 : 0), 0);

  function setQuantity(id: string, value: number) {
    setQty((prev) => ({ ...prev, [id]: Math.max(0, value) }));
  }

  function repeatLast() {
    if (!customer) return;
    const last = lastDeliveryFor(customer.id);
    if (!last) return;
    const next: Record<string, number> = {};
    for (const it of last.items) next[it.productId] = it.quantity;
    setQty(next);
  }

  function handleSave() {
    if (!customer || itemCount === 0) return;
    const items: DeliveryItem[] = data.products
      .filter((p) => (qty[p.id] ?? 0) > 0)
      .map((p) => {
        const q = qty[p.id];
        const unitPrice = priceFor(p, customer);
        return {
          productId: p.id,
          productName: p.name,
          quantity: q,
          unitPrice,
          lineTotal: q * unitPrice,
        };
      });
    const delivery = addDelivery({
      customerId: customer.id,
      items,
      amountPaid: paidNum,
    });
    setSaved({
      name: customer.name,
      total: delivery.productTotal,
      paid: delivery.amountPaid,
      newBalance: delivery.newBalance,
      lines: items.map((i) => `${i.productName} × ${i.quantity}`).join("\n"),
    });
  }

  const hasLast = customer ? !!lastDeliveryFor(customer.id) : false;

  // ---- Success screen ----
  if (saved) {
    const waText = encodeURIComponent(
      `*${data.settings.storeName}*\n\n` +
        `Shop: ${saved.name}\n` +
        `${saved.lines}\n\n` +
        `Total: ${rupees(saved.total)}\n` +
        `Paid: ${rupees(saved.paid)}\n` +
        `*Balance: ${rupees(saved.newBalance)}*`
    );
    return (
      <div className="space-y-5 pt-6 text-center">
        <div className="text-7xl">✅</div>
        <h1 className="text-3xl font-extrabold">Saved!</h1>
        <div className="card space-y-2 text-left">
          <Row label="Shop" value={saved.name} />
          <Row label="Product Total" value={rupees(saved.total)} />
          <Row label="Paid Today" value={rupees(saved.paid)} />
          <div className="border-t border-slate-200 pt-2 dark:border-slate-700">
            <Row
              label="New Balance"
              value={rupees(saved.newBalance)}
              big
              danger={saved.newBalance > 0}
            />
          </div>
        </div>
        <a
          href={`https://wa.me/?text=${waText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary !border-green-600 !text-green-700"
        >
          🟢 Share on WhatsApp
        </a>
        <button className="btn-primary" onClick={() => router.push("/")}>
          🏠 Done
        </button>
        <button
          className="btn-secondary"
          onClick={() => {
            setSaved(null);
            setCustomer(null);
            setQty({});
            setAmountPaid("");
            setShowPicker(true);
          }}
        >
          ➕ Add Another
        </button>
      </div>
    );
  }

  // ---- Customer picker ----
  if (showPicker || !customer) {
    return (
      <CustomerPicker
        customers={data.customers}
        balanceFor={balanceFor}
        onClose={() => {
          if (customer) setShowPicker(false);
          else router.push("/");
        }}
        onPick={(c) => {
          setCustomer(customerById(c.id) ?? c);
          setShowPicker(false);
        }}
      />
    );
  }

  // ---- Delivery entry ----
  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowPicker(true)}
        className="card flex w-full items-center justify-between active:scale-[0.99]"
      >
        <div className="text-left">
          <p className="text-base font-semibold text-slate-500">Shop</p>
          <p className="flex items-center gap-2 text-2xl font-extrabold">
            {customer.name}
            {customer.isDealer && (
              <span className="rounded-full bg-brand px-2 py-0.5 text-sm font-bold text-white">
                Dealer
              </span>
            )}
          </p>
        </div>
        <span className="text-lg font-bold text-brand">Change</span>
      </button>

      <div className="card flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-500">Previous Balance</p>
        <p
          className={`text-2xl font-extrabold ${
            previousBalance > 0 ? "text-money-due" : "text-money-paid"
          }`}
        >
          {rupees(previousBalance)}
        </p>
      </div>

      {hasLast && (
        <button onClick={repeatLast} className="btn-secondary">
          🔁 Repeat Last Delivery
        </button>
      )}

      {/* Product steppers */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Products</h2>
        {data.products.map((p) => {
          const q = qty[p.id] ?? 0;
          const price = priceFor(p, customer);
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
                <p className="text-base text-slate-500">
                  {rupees(price)} each
                  {q > 0 && (
                    <span className="font-bold text-brand dark:text-brand-light">
                      {"  = "}
                      {rupees(q * price)}
                    </span>
                  )}
                </p>
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

      {/* Amount paid */}
      <div className="card space-y-2">
        <label className="field-label">Amount Paid Today</label>
        <input
          type="number"
          inputMode="decimal"
          value={amountPaid}
          onChange={(e) => setAmountPaid(e.target.value)}
          placeholder="0"
          className="field-input text-2xl"
        />
        <div className="flex gap-2">
          <button
            onClick={() =>
              setAmountPaid(String(Math.round((previousBalance + productTotal) * 100) / 100))
            }
            className="flex-1 rounded-xl bg-slate-200 py-2 text-base font-bold dark:bg-slate-800"
          >
            Pay Full ({rupees(previousBalance + productTotal)})
          </button>
          <button
            onClick={() => setAmountPaid(String(productTotal))}
            className="flex-1 rounded-xl bg-slate-200 py-2 text-base font-bold dark:bg-slate-800"
          >
            Today Only
          </button>
        </div>
      </div>

      {/* Live summary */}
      <div className="card space-y-1 bg-brand/5">
        <Row label="Product Total" value={rupees(productTotal)} />
        <Row label="Previous Balance" value={rupees(previousBalance)} />
        <Row label="Paid Today" value={"− " + rupees(paidNum)} />
        <div className="border-t border-slate-300 pt-1 dark:border-slate-600">
          <Row
            label="New Balance"
            value={rupees(newBalance)}
            big
            danger={newBalance > 0}
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={itemCount === 0}
        className="btn-primary !min-h-[72px] text-2xl"
      >
        💾 Save Delivery
        {itemCount > 0 && (
          <span className="text-lg font-semibold">
            ({plainNumber(itemCount)} items)
          </span>
        )}
      </button>
    </div>
  );
}

function Row({
  label,
  value,
  big,
  danger,
}: {
  label: string;
  value: string;
  big?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="flex items-center justify-between">
      <span
        className={`${big ? "text-xl font-bold" : "text-lg"} text-slate-600 dark:text-slate-300`}
      >
        {label}
      </span>
      <span
        className={`${big ? "text-3xl" : "text-xl"} font-extrabold ${
          danger ? "text-money-due" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
