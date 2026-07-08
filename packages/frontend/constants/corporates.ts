// Başlık/açıklamalar i18n kataloğundan gelir: chrome.nav.corporateItems.<key>
// (bkz. messages/tr.json). Burada yalnız route bilgisi tutulur.
export const corporateItems = [
    { key: "about", href: "/hakkimizda" },
    { key: "sustainability", href: "/surdurulebilirlik" },
    { key: "hr", href: "/ik" },
    { key: "feedback", href: "/oneri-sikayet" },
] as const;

export type CorporateItemKey = (typeof corporateItems)[number]["key"];
