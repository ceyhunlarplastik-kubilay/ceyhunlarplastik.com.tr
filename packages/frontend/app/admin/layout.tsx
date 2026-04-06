import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { AdminUserMenu } from "@/components/admin/AdminUserMenu"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/api/auth/signin")

    const groups: string[] = (session.user as any)?.groups ?? []
    const allowed = groups.includes("admin") || groups.includes("owner")

    if (!allowed) redirect("/?unauthorized=1")

    return (
        <div className="min-h-screen flex bg-neutral-50">
            <AdminSidebar />

            <div className="flex-1 flex flex-col min-w-0">
                {/* TOP BAR */}
                <header className="sticky top-0 z-30 flex items-center justify-end gap-3 px-6 py-3 bg-white border-b border-neutral-100 shadow-sm">
                    <AdminUserMenu
                        name={session.user?.name}
                        email={session.user?.email}
                        image={session.user?.image}
                        groups={groups}
                    />
                </header>

                <main className="flex-1 p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}