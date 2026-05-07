import { requireRole } from "@/lib/auth/require-role"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    try {
        await requireRole(["admin", "owner"])
    } catch {
        redirect("/?error=unauthorized")
    }

    return <div>Admin Panel</div>
}
