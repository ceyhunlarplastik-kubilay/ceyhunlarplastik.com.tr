import { getProducts } from "@/features/admin/products/server/getProducts"
import { getCategories } from "@/features/admin/categories/server/getCategories"
import { ProductsTable } from "@/features/admin/products/components/ProductsTable"

export default async function ProductsPage() {
    const productsPayload = await getProducts()
    const categories = await getCategories()

    return <ProductsTable initialData={productsPayload.data} categories={categories} />
}