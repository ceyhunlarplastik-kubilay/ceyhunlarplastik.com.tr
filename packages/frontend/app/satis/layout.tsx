import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AdminUserMenu } from "@/components/admin/AdminUserMenu"

export default async function SalesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/api/auth/signin")

    const groups: string[] = (session.user as any)?.groups ?? []
    const allowed =
        groups.includes("sales") ||
        groups.includes("admin") ||
        groups.includes("owner")

    if (!allowed) redirect("/?unauthorized=1")

    return (
        <div className="min-h-screen bg-neutral-50">
            <header className="sticky top-0 z-30 flex items-center justify-between gap-3 px-6 py-3 bg-white border-b border-neutral-100 shadow-sm">
                <div className="text-sm font-semibold text-neutral-800">Satış Paneli</div>
                <AdminUserMenu
                    name={session.user?.name}
                    email={session.user?.email}
                    image={session.user?.image}
                    groups={groups}
                />
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        </div>
    )
}
