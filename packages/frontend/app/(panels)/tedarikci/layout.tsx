import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { PanelShell } from "@/components/panels/PanelShell"
import { supplierNavGroups } from "@/components/panels/navigation/supplierNav"

export default async function SupplierLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Ftedarikci&error=SessionRequired")

    const groups: string[] =
        (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed = groups.includes("supplier") || groups.includes("admin") || groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <PanelShell
            title="Tedarikçi Paneli"
            subtitle="Operasyon"
            navGroups={supplierNavGroups}
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
