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
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed = groups.includes("customer") || groups.includes("admin") || groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50 md:flex-row">
            <CustomerPortalSidebar
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
            />

            <div className="flex min-w-0 flex-1 flex-col">
                <div className="hidden md:block">
                    <AdminTopbar
                        title="Müşteri Paneli"
                        subtitle="Portal"
                        name={session.user?.name}
                        email={session.user?.email}
                        image={session.user?.image}
                        groups={groups}
                    />
                </div>

                <main className="flex-1 px-4 pb-5 pt-2 sm:px-5 sm:pb-6 sm:pt-3 md:px-6 md:pb-7 md:pt-3 lg:px-8 lg:pb-8 lg:pt-3">
                    <section className="mx-auto w-full max-w-[124rem] min-w-0">
                        {children}
                    </section>
                </main>
            </div>
        </div>
    )
}
