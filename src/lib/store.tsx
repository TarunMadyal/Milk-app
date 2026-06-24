"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppData,
  Customer,
  Delivery,
  DeliveryItem,
  Product,
} from "./types";
import { loadData, newId, saveData } from "./storage";
import { buildSeedData } from "./seed";

interface NewDeliveryInput {
  customerId: string;
  items: DeliveryItem[];
  amountPaid: number;
}

interface StoreContextValue {
  data: AppData;
  ready: boolean;
  // selectors
  customerById: (id: string) => Customer | undefined;
  productById: (id: string) => Product | undefined;
  balanceFor: (customerId: string) => number;
  deliveriesFor: (customerId: string) => Delivery[];
  lastDeliveryFor: (customerId: string) => Delivery | undefined;
  totalOutstanding: () => number;
  // mutations
  addDelivery: (input: NewDeliveryInput) => Delivery;
  addPayment: (customerId: string, amount: number) => Delivery;
  deleteDelivery: (id: string) => void;
  addCustomer: (name: string, isDealer: boolean) => void;
  updateCustomer: (id: string, patch: Partial<Customer>) => void;
  removeCustomer: (id: string) => void;
  updateProduct: (id: string, patch: Partial<Product>) => void;
  setDarkMode: (on: boolean) => void;
  replaceAll: (data: AppData) => void;
  resetAll: () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => buildSeedData());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loaded = loadData();
    setData(loaded);
    setReady(true);
  }, []);

  // Persist + apply dark mode whenever data changes (after initial load).
  useEffect(() => {
    if (!ready) return;
    saveData(data);
    const root = document.documentElement;
    if (data.settings.darkMode) root.classList.add("dark");
    else root.classList.remove("dark");
  }, [data, ready]);

  const update = useCallback((fn: (prev: AppData) => AppData) => {
    setData((prev) => fn(prev));
  }, []);

  const customerById = useCallback(
    (id: string) => data.customers.find((c) => c.id === id),
    [data.customers]
  );

  const productById = useCallback(
    (id: string) => data.products.find((p) => p.id === id),
    [data.products]
  );

  const deliveriesFor = useCallback(
    (customerId: string) =>
      data.deliveries
        .filter((d) => d.customerId === customerId)
        .sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [data.deliveries]
  );

  // Outstanding = sum of (productTotal - amountPaid) across all entries.
  const balanceFor = useCallback(
    (customerId: string) =>
      data.deliveries
        .filter((d) => d.customerId === customerId)
        .reduce((sum, d) => sum + d.productTotal - d.amountPaid, 0),
    [data.deliveries]
  );

  const lastDeliveryFor = useCallback(
    (customerId: string) =>
      data.deliveries
        .filter((d) => d.customerId === customerId && d.type === "delivery")
        .sort((a, b) => +new Date(b.date) - +new Date(a.date))[0],
    [data.deliveries]
  );

  const totalOutstanding = useCallback(
    () =>
      data.deliveries.reduce(
        (sum, d) => sum + d.productTotal - d.amountPaid,
        0
      ),
    [data.deliveries]
  );

  const addDelivery = useCallback(
    (input: NewDeliveryInput) => {
      const customer = data.customers.find((c) => c.id === input.customerId);
      const previousBalance = balanceFor(input.customerId);
      const productTotal = input.items.reduce((s, it) => s + it.lineTotal, 0);
      const delivery: Delivery = {
        id: newId(),
        customerId: input.customerId,
        customerName: customer?.name ?? "",
        date: new Date().toISOString(),
        items: input.items,
        previousBalance,
        productTotal,
        amountPaid: input.amountPaid,
        newBalance: previousBalance + productTotal - input.amountPaid,
        type: "delivery",
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, deliveries: [...prev.deliveries, delivery] }));
      return delivery;
    },
    [data.customers, balanceFor, update]
  );

  const addPayment = useCallback(
    (customerId: string, amount: number) => {
      const customer = data.customers.find((c) => c.id === customerId);
      const previousBalance = balanceFor(customerId);
      const delivery: Delivery = {
        id: newId(),
        customerId,
        customerName: customer?.name ?? "",
        date: new Date().toISOString(),
        items: [],
        previousBalance,
        productTotal: 0,
        amountPaid: amount,
        newBalance: previousBalance - amount,
        type: "payment",
        createdAt: new Date().toISOString(),
      };
      update((prev) => ({ ...prev, deliveries: [...prev.deliveries, delivery] }));
      return delivery;
    },
    [data.customers, balanceFor, update]
  );

  const deleteDelivery = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        deliveries: prev.deliveries.filter((d) => d.id !== id),
      })),
    [update]
  );

  const addCustomer = useCallback(
    (name: string, isDealer: boolean) =>
      update((prev) => ({
        ...prev,
        customers: [
          ...prev.customers,
          {
            id: newId(),
            name: name.trim(),
            isDealer,
            createdAt: new Date().toISOString(),
          },
        ],
      })),
    [update]
  );

  const updateCustomer = useCallback(
    (id: string, patch: Partial<Customer>) =>
      update((prev) => ({
        ...prev,
        customers: prev.customers.map((c) =>
          c.id === id ? { ...c, ...patch } : c
        ),
      })),
    [update]
  );

  const removeCustomer = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        customers: prev.customers.filter((c) => c.id !== id),
      })),
    [update]
  );

  const updateProduct = useCallback(
    (id: string, patch: Partial<Product>) =>
      update((prev) => ({
        ...prev,
        products: prev.products.map((p) =>
          p.id === id ? { ...p, ...patch } : p
        ),
      })),
    [update]
  );

  const setDarkMode = useCallback(
    (on: boolean) =>
      update((prev) => ({
        ...prev,
        settings: { ...prev.settings, darkMode: on },
      })),
    [update]
  );

  const replaceAll = useCallback(
    (incoming: AppData) => {
      setData(incoming);
      saveData(incoming);
    },
    []
  );

  const resetAll = useCallback(() => {
    const seed = buildSeedData();
    setData(seed);
    saveData(seed);
  }, []);

  const value = useMemo<StoreContextValue>(
    () => ({
      data,
      ready,
      customerById,
      productById,
      balanceFor,
      deliveriesFor,
      lastDeliveryFor,
      totalOutstanding,
      addDelivery,
      addPayment,
      deleteDelivery,
      addCustomer,
      updateCustomer,
      removeCustomer,
      updateProduct,
      setDarkMode,
      replaceAll,
      resetAll,
    }),
    [
      data,
      ready,
      customerById,
      productById,
      balanceFor,
      deliveriesFor,
      lastDeliveryFor,
      totalOutstanding,
      addDelivery,
      addPayment,
      deleteDelivery,
      addCustomer,
      updateCustomer,
      removeCustomer,
      updateProduct,
      setDarkMode,
      replaceAll,
      resetAll,
    ]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
