import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Fadmin&error=SessionRequired")

    const groups = (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const allowed = groups.includes("admin") || groups.includes("owner")

    if (!allowed) redirect("/?error=unauthorized")

    return (
        <div className="min-h-screen flex bg-neutral-50">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                <AdminTopbar
                    title="Admin Console"
                    subtitle="Ceyhunlar"
                    name={session.user?.name}
                    email={session.user?.email}
                    image={session.user?.image}
                    groups={groups}
                />

                <main className="flex-1 p-6 md:p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
