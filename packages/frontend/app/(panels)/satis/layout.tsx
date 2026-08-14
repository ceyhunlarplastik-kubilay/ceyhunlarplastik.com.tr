import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { RoleWorkspaceSidebar } from "@/components/admin/RoleWorkspaceSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"

const baseNavItems = [
    {
        href: "/satis",
        label: "Atanmış Müşteriler",
        icon: "users" as const,
    },
    {
        href: "/satis/urunler",
        label: "Ürünler",
        icon: "boxes" as const,
        match: "prefix" as const,
    },
    {
        href: "/satis/harita",
        label: "Harita",
        icon: "map" as const,
        match: "prefix" as const,
    },
    {
        href: "/satis/onaylar",
        label: "Onay Talepleri",
        icon: "shield" as const,
        match: "prefix" as const,
    },
    {
        href: "/satis/siparisler",
        label: "Siparişler",
        icon: "clipboard" as const,
        match: "prefix" as const,
    },
]

/**
 * Kampanya YÖNETİMİ satış temsilcisine kapalı: uç `sales_director/admin/owner`
 * istiyor, temsilciye gösterilseydi tıklayınca 403 alırdı. Temsilci Aşama 2'de
 * yalnız mevcut kampanyayı kendi müşterilerine duyurabilecek.
 */
const campaignNavItem = {
    href: "/satis/kampanyalar",
    label: "Kampanyalar",
    icon: "megaphone" as const,
    match: "prefix" as const,
}

function buildNavItems(groups: string[]) {
    const canManageCampaigns =
        groups.includes("sales_director") || groups.includes("admin") || groups.includes("owner")

    return canManageCampaigns ? [...baseNavItems, campaignNavItem] : baseNavItems
}

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
        <div className="min-h-screen flex flex-col bg-neutral-50 md:flex-row">
            <RoleWorkspaceSidebar
                panelTitle="Satış Paneli"
                panelSubtitle="Operasyon"
                navItems={buildNavItems(groups)}
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
                mobileActionSlot={<NotificationBell viewport="mobile" requestsHref="/satis/onaylar" />}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <div className="hidden md:block">
                    <AdminTopbar
                        title="Satış Paneli"
                        subtitle="Operasyon"
                        name={session.user?.name}
                        email={session.user?.email}
                        image={session.user?.image}
                        groups={groups}
                        actionSlot={<NotificationBell viewport="desktop" requestsHref="/satis/onaylar" />}
                    />
                </div>

                <main className="flex-1 p-4 sm:p-5 md:p-8">{children}</main>
            </div>
        </div>
    )
}
