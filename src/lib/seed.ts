import type { AppData, Customer, Product } from "./types";

export const STORE_NAME = "Manjunath Milk Store Haveri";

export const DEALER_NAMES = ["Ashpak", "Shiraj", "Narjund"];

const SHOP_NAMES = [
  "Spoorti",
  "Devihosur",
  "Karnataka",
  "Ajja(local)",
  "Madhu",
  "Sai",
  "Manju",
  "Slv",
  "Basana",
  "Allapnavar",
  "Morotaji",
  "Tea",
  "Hombaredy",
  "Kotresh",
  "Riyaz",
  "Timmaana",
  "Ajja(nmt)",
  "Swamy",
  "Savanaur",
  "Aunty",
  "Malu",
  "Sunita",
  "Savakanar",
  "Ka25",
  "XYZ",
  "Shivaraj",
  "Ahmed",
  "Shivabasu",
  "Karebasu",
  "Shree",
  "Muddi",
  "Sadik",
  "Kalburgi",
  "Mejraj",
  "Viranna",
  "Sadik 2",
  "Aslam",
  "Chunnu",
  "Sulemaan",
  "Aunty (nmt)",
  "Immam",
  "Chandrana",
  "Tousif",
  "Murli",
  "XYZ 2",
];

// Regular and dealer price tables, exactly as provided by the owner.
// [id, displayName, regularPrice, dealerPrice]
const PRODUCT_TABLE: [string, string, number, number][] = [
  ["SM_1000", "SM 1000", 64, 64],
  ["SM_500", "SM 500", 66, 65],
  ["FCM_1000", "FCM 1000", 72, 72],
  ["FCM_500", "FCM 500", 74, 73],
  ["TM_1000", "TM 1000", 52, 52],
  ["TM_500", "TM 500", 54, 53],
  ["SM_135", "SM 135", 9.5, 9],
  ["Curd_110", "Curd 110", 9.5, 9],
  ["Curd_400", "Curd 400", 31, 30],
  ["Curd_500", "Curd 500", 37, 35.5],
  ["MJ", "MJ", 9, 9],
  ["LS", "LS", 14, 13.5],
];

function id(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function buildSeedData(): AppData {
  const dealerSet = new Set(DEALER_NAMES.map((n) => n.toLowerCase()));

  const customers: Customer[] = SHOP_NAMES.map((name) => ({
    id: id(),
    name,
    isDealer: false,
    createdAt: new Date().toISOString(),
  }));

  // Add dealers as their own customers (they buy at dealer price).
  for (const dn of DEALER_NAMES) {
    customers.push({
      id: id(),
      name: dn,
      isDealer: true,
      createdAt: new Date().toISOString(),
    });
  }

  // (dealerSet kept for clarity / future name-based checks)
  void dealerSet;

  const products: Product[] = PRODUCT_TABLE.map(
    ([pid, name, regularPrice, dealerPrice]) => ({
      id: pid,
      name,
      regularPrice,
      dealerPrice,
    })
  );

  return {
    customers,
    products,
    deliveries: [],
    stockEntries: [],
    settings: { storeName: STORE_NAME, darkMode: false },
    version: 1,
  };
}
