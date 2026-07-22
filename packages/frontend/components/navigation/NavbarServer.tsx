import { getCategories } from "@/features/public/categories/server/getCategories";
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter";
import { NavbarClient } from "./NavbarClient";
import { getLocale } from "next-intl/server";

export async function Navbar() {
    const locale = await getLocale();
    const categories = await getCategories(locale);
    const attributes = await getAttributesForFilter(locale);

    return <NavbarClient categories={categories} attributes={attributes} />;
}
