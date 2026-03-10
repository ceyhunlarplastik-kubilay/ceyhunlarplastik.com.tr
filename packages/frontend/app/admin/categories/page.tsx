import { getCategories } from "@/features/admin/categories/server/getCategories";
import { CategoriesTable } from "@/features/admin/categories/components/CategoriesTable";

export default async function CategoriesPage() {
    const categories = await getCategories();
    return <CategoriesTable initialData={categories} />;
}