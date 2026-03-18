import Link from "next/link"
import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"

import { AdminSidebar } from "@/components/admin/AdminSidebar"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/api/auth/signin")

    const groups = session.user?.groups ?? []
    const allowed = groups.includes("admin") || groups.includes("owner")

    if (!allowed) redirect("/?unauthorized=1")

    return (
        <div className="min-h-screen flex bg-neutral-50">
            <AdminSidebar />
            <main className="flex-1 p-6">
                {children}
            </main>
        </div>
    )
}