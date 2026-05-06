import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

export default async function SalesLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/api/auth/signin")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const allowed =
        groups.includes("sales") ||
        groups.includes("admin") ||
        groups.includes("owner")

    if (!allowed) redirect("/?unauthorized=1")

    return (
        <div className="min-h-screen bg-neutral-50">
            <AdminTopbar
                title="Satış Paneli"
                subtitle="Operasyon"
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
            />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">{children}</main>
        </div>
    )
}
