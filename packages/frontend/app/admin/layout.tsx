import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"
import { NotificationBell } from "@/features/notifications/components/NotificationBell"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fadmin&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
    const allowed = groups.includes("admin") || groups.includes("owner")

    if (accessStatus !== "ACTIVE") redirect("/hesabim")
    if (!allowed) redirect("/?error=unauthorized")

    return (
        <div className="min-h-screen flex flex-col bg-neutral-50 md:flex-row">
            <AdminSidebar
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
                mobileActionSlot={<NotificationBell viewport="mobile" requestsHref="/admin/onaylar" />}
            />

            <div className="flex-1 flex flex-col min-w-0">
                <div className="hidden md:block">
                    <AdminTopbar
                        title="Admin Console"
                        subtitle="Ceyhunlar"
                        name={session.user?.name}
                        email={session.user?.email}
                        image={session.user?.image}
                        groups={groups}
                        actionSlot={<NotificationBell viewport="desktop" requestsHref="/admin/onaylar" />}
                    />
                </div>

                <main className="flex-1 p-4 sm:p-5 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
