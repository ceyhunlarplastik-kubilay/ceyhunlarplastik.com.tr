import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AdminTopbar } from "@/components/admin/AdminTopbar"

export default async function SupplierLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const session = await auth()

    if (!session) redirect("/auth/signin?callbackUrl=%2Ftedarikci&error=SessionRequired")

    const groups: string[] =
        (session.user as { groups?: string[] } | undefined)?.groups ?? []
    const allowed = groups.includes("supplier") || groups.includes("admin") || groups.includes("owner")

    if (!allowed) redirect("/?error=unauthorized")

    return (
        <div className="min-h-screen bg-neutral-50">
            <AdminTopbar
                title="Tedarikçi Paneli"
                subtitle="Operasyon"
                name={session.user?.name}
                email={session.user?.email}
                image={session.user?.image}
                groups={groups}
            />
            <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6">{children}</main>
        </div>
    )
}
