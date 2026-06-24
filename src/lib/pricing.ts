import type { Customer, Product } from "./types";

// Returns the correct unit price for a product given the customer type.
// Dealers (Ashpak, Shiraj, Narjund) get dealer pricing; everyone else regular.
export function priceFor(product: Product, customer: Customer | undefined): number {
  if (customer && customer.isDealer) return product.dealerPrice;
  return product.regularPrice;
}
