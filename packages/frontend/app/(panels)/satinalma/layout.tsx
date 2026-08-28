import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { PanelShell } from "@/components/panels/PanelShell"
import { purchasingNavGroups } from "@/components/panels/navigation/purchasingNav"

export default async function PurchasingLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fsatinalma&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed =
        groups.includes("purchasing") ||
        groups.includes("admin") ||
        groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <PanelShell
            title="Satın Alma Paneli"
            subtitle="Operasyon"
            navGroups={purchasingNavGroups}
            user={{
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image,
                groups,
            }}
        >
            {children}
        </PanelShell>
    )
}
