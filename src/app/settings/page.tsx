"use client";

import { useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { rupees } from "@/lib/format";
import type { AppData } from "@/lib/types";

export default function SettingsPage() {
  const {
    data,
    setDarkMode,
    updateProduct,
    addCustomer,
    updateCustomer,
    removeCustomer,
    balanceFor,
    replaceAll,
    resetAll,
  } = useStore();

  const [open, setOpen] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function toggle(key: string) {
    setOpen((o) => (o === key ? null : key));
  }

  function exportJSON() {
    download(
      JSON.stringify(data, null, 2),
      `milk-backup-${new Date().toISOString().slice(0, 10)}.json`,
      "application/json"
    );
  }

  function exportCSV() {
    const header = [
      "Date",
      "Shop",
      "Type",
      "Products",
      "ProductTotal",
      "AmountPaid",
      "NewBalance",
    ];
    const rows = data.deliveries.map((d) => [
      new Date(d.date).toLocaleString("en-IN"),
      d.customerName,
      d.type,
      d.items.map((i) => `${i.productName} x${i.quantity}`).join(" | "),
      String(d.productTotal),
      String(d.amountPaid),
      String(d.newBalance),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    download(
      csv,
      `milk-deliveries-${new Date().toISOString().slice(0, 10)}.csv`,
      "text/csv"
    );
  }

  function handleRestore(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as AppData;
        if (!parsed.customers || !parsed.products || !parsed.deliveries) {
          alert("Invalid backup file.");
          return;
        }
        if (confirm("Restore this backup? Current data will be replaced.")) {
          replaceAll(parsed);
          alert("Backup restored ✅");
        }
      } catch {
        alert("Could not read this file.");
      }
    };
    reader.readAsText(file);
  }

  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-extrabold">⚙️ Settings</h1>

      {/* Dark mode */}
      <div className="card flex items-center justify-between">
        <span className="text-xl font-bold">🌙 Dark Mode</span>
        <button
          onClick={() => setDarkMode(!data.settings.darkMode)}
          className={`relative h-10 w-20 rounded-full transition-colors ${
            data.settings.darkMode ? "bg-brand" : "bg-slate-300"
          }`}
          aria-label="Toggle dark mode"
        >
          <span
            className={`absolute top-1 h-8 w-8 rounded-full bg-white transition-all ${
              data.settings.darkMode ? "left-11" : "left-1"
            }`}
          />
        </button>
      </div>

      {/* Edit prices */}
      <Section
        title="💰 Edit Prices"
        open={open === "prices"}
        onToggle={() => toggle("prices")}
      >
        <div className="grid grid-cols-[1fr_auto_auto] items-center gap-2 px-1 pb-1 text-sm font-bold text-slate-500">
          <span>Product</span>
          <span className="w-24 text-center">Regular</span>
          <span className="w-24 text-center">Dealer</span>
        </div>
        {data.products.map((p) => (
          <div
            key={p.id}
            className="grid grid-cols-[1fr_auto_auto] items-center gap-2 py-1"
          >
            <span className="text-lg font-bold">{p.name}</span>
            <input
              type="number"
              inputMode="decimal"
              defaultValue={p.regularPrice}
              onBlur={(e) =>
                updateProduct(p.id, {
                  regularPrice: parseFloat(e.target.value) || 0,
                })
              }
              className="w-24 rounded-xl border-2 border-slate-300 px-2 py-2 text-center text-lg font-bold dark:border-slate-700 dark:bg-slate-800"
            />
            <input
              type="number"
              inputMode="decimal"
              defaultValue={p.dealerPrice}
              onBlur={(e) =>
                updateProduct(p.id, {
                  dealerPrice: parseFloat(e.target.value) || 0,
                })
              }
              className="w-24 rounded-xl border-2 border-slate-300 px-2 py-2 text-center text-lg font-bold dark:border-slate-700 dark:bg-slate-800"
            />
          </div>
        ))}
        <p className="pt-2 text-sm text-slate-400">
          Changes save when you tap away from a box. Old entries keep their
          original price.
        </p>
      </Section>

      {/* Manage customers */}
      <Section
        title="👥 Customers"
        open={open === "customers"}
        onToggle={() => toggle("customers")}
      >
        <AddCustomer onAdd={addCustomer} />
        <ul className="space-y-2 pt-2">
          {[...data.customers]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2 dark:bg-slate-800"
              >
                <span className="text-lg font-bold">{c.name}</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateCustomer(c.id, { isDealer: !c.isDealer })
                    }
                    className={`rounded-lg px-2 py-1 text-sm font-bold ${
                      c.isDealer
                        ? "bg-brand text-white"
                        : "bg-slate-300 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    }`}
                  >
                    {c.isDealer ? "Dealer" : "Regular"}
                  </button>
                  <button
                    onClick={() => {
                      const bal = balanceFor(c.id);
                      if (bal !== 0) {
                        alert(
                          `Cannot remove ${c.name}: balance is ${rupees(bal)}.`
                        );
                        return;
                      }
                      if (confirm(`Remove ${c.name}?`)) removeCustomer(c.id);
                    }}
                    className="rounded-lg px-2 py-1 text-sm font-bold text-money-due"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
        </ul>
      </Section>

      {/* Export & backup */}
      <Section
        title="📤 Export & Backup"
        open={open === "data"}
        onToggle={() => toggle("data")}
      >
        <div className="space-y-2">
          <button onClick={exportJSON} className="btn-secondary">
            💾 Download Backup (JSON)
          </button>
          <button onClick={exportCSV} className="btn-secondary">
            📊 Export Deliveries (CSV)
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-secondary"
          >
            ♻️ Restore from Backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleRestore(f);
              e.target.value = "";
            }}
          />
        </div>
      </Section>

      {/* Danger zone */}
      <Section
        title="⚠️ Reset"
        open={open === "reset"}
        onToggle={() => toggle("reset")}
      >
        <p className="pb-2 text-base text-slate-500">
          This erases all deliveries and restores the original shop & price
          list. Take a backup first!
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                "Erase ALL data and reset to default? This cannot be undone."
              )
            ) {
              resetAll();
              alert("App reset to defaults.");
            }
          }}
          className="btn-secondary !border-money-due !text-money-due"
        >
          🗑️ Reset All Data
        </button>
      </Section>

      <p className="pt-4 text-center text-sm text-slate-400">
        {data.settings.storeName} · {data.customers.length} shops ·{" "}
        {data.deliveries.length} entries
      </p>
    </div>
  );
}

function Section({
  title,
  open,
  onToggle,
  children,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="card !p-0 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex min-h-touch w-full items-center justify-between px-4 py-4 text-left text-xl font-bold"
      >
        {title}
        <span className="text-2xl">{open ? "▾" : "▸"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function AddCustomer({
  onAdd,
}: {
  onAdd: (name: string, isDealer: boolean) => void;
}) {
  const [name, setName] = useState("");
  const [isDealer, setIsDealer] = useState(false);
  return (
    <div className="space-y-2 rounded-xl bg-brand/5 p-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="New shop name"
        className="field-input"
      />
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsDealer((v) => !v)}
          className={`flex-1 rounded-xl py-2 text-base font-bold ${
            isDealer
              ? "bg-brand text-white"
              : "bg-slate-200 text-slate-700 dark:bg-slate-700"
          }`}
        >
          {isDealer ? "Dealer ✓" : "Mark as Dealer"}
        </button>
        <button
          onClick={() => {
            if (!name.trim()) return;
            onAdd(name, isDealer);
            setName("");
            setIsDealer(false);
          }}
          className="flex-1 rounded-xl bg-brand py-2 text-base font-bold text-white"
        >
          ➕ Add Shop
        </button>
      </div>
    </div>
  );
}

function download(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
