import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { PanelShell } from "@/components/panels/PanelShell"
import { adminNavGroups } from "@/components/panels/navigation/adminNav"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fadmin&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed = groups.includes("admin") || groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <PanelShell
            title="Admin Console"
            subtitle="Ceyhunlar"
            navGroups={adminNavGroups}
            user={{
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image,
                groups,
            }}
            actionSlot={<NotificationBell viewport="desktop" requestsHref="/admin/onaylar" />}
            mobileActionSlot={<NotificationBell viewport="mobile" requestsHref="/admin/onaylar" />}
        >
            {children}
        </PanelShell>
    )
}
