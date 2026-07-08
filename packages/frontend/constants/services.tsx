// Başlık/açıklamalar i18n kataloğundan gelir: chrome.nav.serviceItems.<key>
// (bkz. messages/tr.json). Burada yalnız route bilgisi tutulur.
export const serviceItems = [
    { key: "rnd", href: "/arge-ve-prototipleme" },
    { key: "printing3d", href: "/3d-baski-ve-tarama" },
    { key: "machining", href: "/talasli-imalat" },
    { key: "massProduction", href: "/seri-uretim" },
] as const;

export type ServiceItemKey = (typeof serviceItems)[number]["key"];
