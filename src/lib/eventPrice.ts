import type { SupabaseClient } from "@supabase/supabase-js";

export const DEFAULT_CURRENCY = "INR";

export const CURRENCIES = [
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "AED", symbol: "AED ", name: "UAE Dirham" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
] as const;

// Read apart from the main event query: if these columns don't exist yet, the event page must still open.
export async function fetchPriceOptions(client: SupabaseClient<any, any, any>, eventId: string) {
  const { data } = await client.from("events").select("price_currency, price_is_starting").eq("id", eventId).maybeSingle();
  return {
    price_currency: (data?.price_currency as string | undefined) ?? DEFAULT_CURRENCY,
    price_is_starting: Boolean(data?.price_is_starting),
  };
}

export function isSupportedCurrency(code: unknown) {
  return CURRENCIES.some((currency) => currency.code === code);
}

export function formatEventPrice(price: number, currency?: string | null, isStartingPrice?: boolean | null) {
  const symbol = CURRENCIES.find((option) => option.code === currency)?.symbol ?? "₹";
  return `${isStartingPrice ? "From " : ""}${symbol}${price.toLocaleString("en-IN")}`;
}
