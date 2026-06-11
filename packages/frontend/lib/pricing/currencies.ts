export const PRICE_CURRENCY_OPTIONS = [
    { value: "TRY", label: "TRY" },
    { value: "USD", label: "USD" },
    { value: "EUR", label: "EUR" },
] as const

export type PriceCurrencyCode = typeof PRICE_CURRENCY_OPTIONS[number]["value"]
