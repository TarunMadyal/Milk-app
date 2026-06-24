"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { rupees } from "@/lib/format";
import type { Customer } from "@/lib/types";
import CustomerPicker from "@/components/CustomerPicker";

export default function MarkPaidPage() {
  const router = useRouter();
  const { data, balanceFor, addPayment } = useStore();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [showPicker, setShowPicker] = useState(true);
  const [amount, setAmount] = useState("");
  const [done, setDone] = useState<null | { name: string; newBalance: number }>(
    null
  );

  const balance = customer ? balanceFor(customer.id) : 0;
  const amt = parseFloat(amount) || 0;

  function handleSave() {
    if (!customer || amt <= 0) return;
    const d = addPayment(customer.id, amt);
    setDone({ name: customer.name, newBalance: d.newBalance });
  }

  if (done) {
    return (
      <div className="space-y-5 pt-10 text-center">
        <div className="text-7xl">✅</div>
        <h1 className="text-3xl font-extrabold">Payment Recorded</h1>
        <div className="card space-y-2">
          <p className="text-xl font-bold">{done.name}</p>
          <p className="text-lg text-slate-500">New Balance</p>
          <p
            className={`text-4xl font-extrabold ${
              done.newBalance > 0 ? "text-money-due" : "text-money-paid"
            }`}
          >
            {rupees(done.newBalance)}
          </p>
        </div>
        <button className="btn-primary" onClick={() => router.push("/")}>
          🏠 Done
        </button>
      </div>
    );
  }

  if (showPicker || !customer) {
    return (
      <CustomerPicker
        customers={data.customers}
        balanceFor={balanceFor}
        onClose={() => (customer ? setShowPicker(false) : router.push("/"))}
        onPick={(c) => {
          setCustomer(c);
          setShowPicker(false);
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">💵 Mark Paid</h1>

      <button
        onClick={() => setShowPicker(true)}
        className="card flex w-full items-center justify-between active:scale-[0.99]"
      >
        <div className="text-left">
          <p className="text-base font-semibold text-slate-500">Shop</p>
          <p className="text-2xl font-extrabold">{customer.name}</p>
        </div>
        <span className="text-lg font-bold text-brand">Change</span>
      </button>

      <div className="card flex items-center justify-between">
        <p className="text-lg font-semibold text-slate-500">Current Balance</p>
        <p
          className={`text-3xl font-extrabold ${
            balance > 0 ? "text-money-due" : "text-money-paid"
          }`}
        >
          {rupees(balance)}
        </p>
      </div>

      <div className="card space-y-2">
        <label className="field-label">Amount Received</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="field-input text-3xl"
        />
        <button
          onClick={() => setAmount(String(Math.round(balance * 100) / 100))}
          className="w-full rounded-xl bg-slate-200 py-2 text-base font-bold dark:bg-slate-800"
        >
          Clear Full Balance ({rupees(balance)})
        </button>
      </div>

      {amt > 0 && (
        <div className="card flex items-center justify-between bg-brand/5">
          <span className="text-xl font-bold">New Balance</span>
          <span
            className={`text-3xl font-extrabold ${
              balance - amt > 0 ? "text-money-due" : "text-money-paid"
            }`}
          >
            {rupees(balance - amt)}
          </span>
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={amt <= 0}
        className="btn-primary !min-h-[72px] text-2xl"
      >
        💾 Save Payment
      </button>
    </div>
  );
}
