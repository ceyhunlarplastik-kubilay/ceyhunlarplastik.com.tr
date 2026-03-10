import { getCategories } from "@/features/public/categories/server/getCategories";
import { NavbarClient } from "./NavbarClient";

export async function Navbar() {
    const categories = await getCategories();

    return <NavbarClient categories={categories} />;
}