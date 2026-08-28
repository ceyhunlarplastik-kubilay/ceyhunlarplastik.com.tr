import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { PanelShell } from "@/components/panels/PanelShell"
import { customerPortalNavGroups } from "@/components/panels/navigation/customerPortalNav"
import { CustomerPortalCalendarCard } from "@/features/customerPortal/components/CustomerPortalCalendarCard"
import { CustomerPortalCartDock } from "@/features/customerPortal/components/CustomerPortalCartDock"
import { CustomerPortalCartDrawer } from "@/features/customerPortal/components/CustomerPortalCartDrawer"

export default async function CustomerPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fmusteri&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed = groups.includes("customer") || groups.includes("admin") || groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <PanelShell
            title="Müşteri Paneli"
            subtitle="Portal"
            navGroups={customerPortalNavGroups}
            user={{
                name: session.user?.name,
                email: session.user?.email,
                image: session.user?.image,
                groups,
            }}
            actionSlot={<CustomerPortalCartDock mode="topbar" />}
            // Takvim eskiden de yalnız masaüstünde vardı; mobil menüde yer
            // kaplamasın diye aynı sınır korunuyor.
            sidebarFooterSlot={
                <div className="hidden md:block">
                    <CustomerPortalCalendarCard />
                </div>
            }
            // Portal kendi dikey ritmine sahip; alt dolgu mobil sepet çubuğunun
            // altında kalan içeriği kurtarır (çubuk `fixed`).
            contentClassName="px-4 pt-2 pb-[calc(7.5rem+env(safe-area-inset-bottom))] sm:px-5 sm:pt-3 md:px-6 md:pt-3 md:pb-7 lg:px-8 lg:pt-3 lg:pb-8"
        >
            <section className="mx-auto w-full max-w-496 min-w-0">{children}</section>

            {/* `fixed inset-x-0 bottom-0` — ağaçtaki yeri görünümü etkilemiyor. */}
            <CustomerPortalCartDock mode="mobile-sticky" />
            <CustomerPortalCartDrawer />
        </PanelShell>
    )
}
