import { ProductionLotDetailPageClient } from "@/features/production/lots/components/ProductionLotDetailPageClient"

export default async function ProductionLotPage({ params }: { params: Promise<{ lotNumber: string }> }) {
    const { lotNumber } = await params
    return <ProductionLotDetailPageClient lotNumber={decodeURIComponent(lotNumber)} />
}
