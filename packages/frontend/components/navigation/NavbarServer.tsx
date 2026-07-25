import { getCategories } from "@/features/public/categories/server/getCategories";
import { getAssistantAttributes } from "@/features/public/productAttributes/server/getAttributesForFilter";
import { NavbarClient } from "./NavbarClient";
import { getLocale } from "next-intl/server";

export async function Navbar() {
    const locale = await getLocale();
    // Paralel: cache-miss'te iki upstream çağrısı arka arkaya beklemesin (waterfall'u kes).
    // Navbar attributes'ı yalnız numune-talep dialog'unda (3 code) kullanıyor → slim yeterli.
    const [categories, attributes] = await Promise.all([
        getCategories(locale),
        getAssistantAttributes(locale),
    ]);

    return <NavbarClient categories={categories} attributes={attributes} />;
}
