import { ProductAttributesPageClient } from "@/features/admin/productAttributes/components/ProductAttributesPageClient"

export default function ContentEntryProductAttributesPage() {
    return (
        <ProductAttributesPageClient
            basePath="/veri-girisi/productAttributes"
            title="Özellikler"
            description="Sektör, üretim grubu, endüstriyel kullanım alanı ve diğer ürün özellik değerlerini yönetin."
        />
    )
}
