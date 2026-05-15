import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { RoleWorkspaceSidebar } from "@/components/admin/RoleWorkspaceSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

const navItems = [
    {
        href: "/tedarikci",
        label: "Bilgiler",
        icon: "building" as const,
    },
    {
        href: "/tedarikci/urunler",
        label: "Ürünler",
        icon: "boxes" as const,
        match: "prefix" as const,
    },
    {
        href: "/tedarikci/onay-talepleri",
        label: "Son Onay Talepleri",
        icon: "shield" as const,
    },
]

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
        <div className="min-h-screen flex flex-col bg-neutral-50 md:flex-row">
            <RoleWorkspaceSidebar
                panelTitle="Tedarikçi Paneli"
                panelSubtitle="Operasyon"
                navItems={navItems}
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
            />

            <div className="flex-1 flex min-w-0 flex-col">
                <div className="hidden md:block">
                    <AdminTopbar
                        title="Tedarikçi Paneli"
                        subtitle="Operasyon"
                        name={session.user?.name}
                        email={session.user?.email}
                        image={session.user?.image}
                        groups={groups}
                    />
                </div>

                <main className="flex-1 p-4 sm:p-5 md:p-8">{children}</main>
            </div>
        </div>
    )
}
