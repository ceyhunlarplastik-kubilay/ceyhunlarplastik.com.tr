import { requireRole } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminPage() {
    try {
        await requireRole(["admin", "owner"])
    } catch {
        redirect("/")
    }

    return <div>Admin Panel</div>
}