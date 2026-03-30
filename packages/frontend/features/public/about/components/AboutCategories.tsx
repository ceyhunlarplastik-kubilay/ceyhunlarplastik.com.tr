import { getCategories } from "@/features/public/categories/server/getCategories";
import AboutCategoriesClient from "./AboutCategoriesClient";

export default async function AboutCategories() {
    const categories = await getCategories();

    return <AboutCategoriesClient categories={categories} />;
}