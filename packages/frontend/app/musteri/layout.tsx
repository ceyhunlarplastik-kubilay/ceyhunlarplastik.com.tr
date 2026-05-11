import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AdminTopbar } from "@/components/admin/AdminTopbar"
import { CustomerPortalSidebar } from "@/features/customerPortal/components/CustomerPortalSidebar"

export default async function CustomerPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fmusteri&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const allowed = groups.includes("customer") || groups.includes("admin") || groups.includes("owner")

    if (!allowed) redirect("/?error=unauthorized")

    return (
        <div className="min-h-screen bg-neutral-50">
            <AdminTopbar
                title="Müşteri Paneli"
                subtitle="Portal"
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
            />
            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
                <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
                    <CustomerPortalSidebar />
                    <section className="min-w-0">{children}</section>
                </div>
            </main>
        </div>
    )
}
