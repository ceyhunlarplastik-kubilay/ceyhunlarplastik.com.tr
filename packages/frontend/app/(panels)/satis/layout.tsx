import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { PanelShell } from "@/components/panels/PanelShell"
import { buildSalesNavGroups } from "@/components/panels/navigation/salesNav"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"

export default async function SalesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fsatis&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed =
        groups.includes("sales") ||
        groups.includes("sales_director") ||
        groups.includes("admin") ||
        groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <PanelShell
            title="Satış Paneli"
            subtitle="Operasyon"
            navGroups={buildSalesNavGroups(groups)}
            user={{
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image,
                groups,
            }}
            actionSlot={<NotificationBell viewport="desktop" requestsHref="/satis/onaylar" />}
            mobileActionSlot={<NotificationBell viewport="mobile" requestsHref="/satis/onaylar" />}
        >
            {children}
        </PanelShell>
    )
}
