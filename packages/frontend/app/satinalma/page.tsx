import { SupplierVariantPricesPageClient } from "@/features/supplier/variantPrices/components/SupplierVariantPricesPageClient"
import { auth } from "@/lib/auth/auth"

export default async function PurchasingPage() {
    const session = await auth()
    const groups: string[] = ((session?.user as any)?.groups ?? []) as string[]
    const viewerMode = groups.includes("owner") || groups.includes("admin") ? "full" : "purchasing"

    return <SupplierVariantPricesPageClient mode="purchasing" viewerMode={viewerMode} />
}
