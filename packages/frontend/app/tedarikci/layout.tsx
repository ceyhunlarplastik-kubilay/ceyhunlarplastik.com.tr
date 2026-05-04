import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AdminUserMenu } from "@/components/admin/AdminUserMenu"

export default async function SupplierLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/api/auth/signin")

    const groups: string[] =
        (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const allowed = groups.includes("supplier") || groups.includes("admin") || groups.includes("owner")

    if (!allowed) redirect("/?unauthorized=1")

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-neutral-100 bg-white px-6 py-3 shadow-sm">
                <div className="text-sm font-semibold text-neutral-800">Tedarikçi Paneli</div>
                <AdminUserMenu
                    name={session.user?.name}
                    email={session.user?.email}
                    image={session.user?.image}
                    groups={groups}
                />
            </header>
            <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</main>
        </div>
    )
}
