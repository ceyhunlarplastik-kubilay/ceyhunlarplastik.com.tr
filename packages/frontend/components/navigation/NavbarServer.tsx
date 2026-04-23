import { getCategories } from "@/features/public/categories/server/getCategories";
import { getAttributesForFilter } from "@/features/public/productAttributes/server/getAttributesForFilter";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
    const categories = await getCategories();
    const attributes = await getAttributesForFilter();

    return <NavbarClient categories={categories} attributes={attributes} />;
}
