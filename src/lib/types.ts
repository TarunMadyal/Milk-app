export interface Customer {
  id: string;
  name: string;
  isDealer: boolean;
  createdAt: string;
}

export interface Product {
  id: string; // e.g. "SM_1000"
  name: string; // display name e.g. "SM 1000"
  regularPrice: number;
  dealerPrice: number;
}

export interface DeliveryItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number; // price snapshot at time of sale
  lineTotal: number; // quantity * unitPrice
}

export interface Delivery {
  id: string;
  customerId: string;
  customerName: string;
  date: string; // ISO date-time
  items: DeliveryItem[];
  previousBalance: number;
  productTotal: number;
  amountPaid: number;
  newBalance: number;
  type: "delivery" | "payment"; // "payment" = money received without a delivery
  createdAt: string;
}

export interface Settings {
  storeName: string;
  darkMode: boolean;
}

export interface AppData {
  customers: Customer[];
  products: Product[];
  deliveries: Delivery[];
  settings: Settings;
  version: number;
}
