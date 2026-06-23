import { RoleWorkspaceSidebar } from "@/components/admin/RoleWorkspaceSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

const navItems = [
    {
        href: "/veri-girisi/categories",
        label: "Kategoriler",
        icon: "boxes" as const,
        match: "prefix" as const,
    },
    {
        href: "/veri-girisi/products",
        label: "Ürünler",
        icon: "package" as const,
        match: "prefix" as const,
    },
]

export default async function ContentEntryLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fveri-girisi&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed =
        groups.includes("content_editor") ||
        groups.includes("admin") ||
        groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50 md:flex-row">
            <RoleWorkspaceSidebar
                panelTitle="Veri Girişi Paneli"
                panelSubtitle="İçerik"
                navItems={navItems}
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
            />

            <div className="flex-1 flex min-w-0 flex-col">
                <div className="hidden md:block">
                    <AdminTopbar
                        title="Veri Girişi Paneli"
                        subtitle="İçerik"
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
