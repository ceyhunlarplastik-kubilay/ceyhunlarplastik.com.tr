import { getCategories } from "@/features/public/categories/server/getCategories";
import AboutCategoriesClient from "./AboutCategoriesClient";
import { getLocale } from "next-intl/server";

export default async function AboutCategories() {
    const locale = await getLocale();
    const categories = await getCategories(locale);

    return <AboutCategoriesClient categories={categories} />;
}
