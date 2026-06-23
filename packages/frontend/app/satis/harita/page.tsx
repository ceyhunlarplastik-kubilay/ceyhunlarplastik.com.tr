import { redirect } from "next/navigation"
import { CustomerMapPageClient } from "@/features/customerLocations/components/CustomerMapPageClient"
import { auth } from "@/lib/auth/auth"

export default async function SalesMapPage() {
    const session = await auth()

    if (!session) {
        redirect("/auth/signin?callbackUrl=%2Fsatis%2Fharita&error=SessionRequired")
    }

    const groups = session.user?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (groups.includes("admin") || groups.includes("owner")) {
        redirect("/admin/musteriler/harita")
    }
    if (!groups.includes("sales") && !groups.includes("sales_director")) {
        redirect("/?error=unauthorized")
    }

    return (
        <CustomerMapPageClient
            title="Müşteri Haritası"
            description="Atanmış müşterileri harita üzerinde izleyin, görünür bölgedeki pinleri filtreleyin ve sahada hızlıca yol tarifi alın."
            customerDetailBasePath="/satis/musteriler"
            allowSalesFilter={groups.includes("sales_director")}
        />
    )
}

