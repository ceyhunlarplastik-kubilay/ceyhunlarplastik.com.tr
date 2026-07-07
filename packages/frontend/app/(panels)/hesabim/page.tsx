import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AccountStatusPageClient } from "@/features/auth/components/AccountStatusPageClient"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function AccountStatusPage() {
    const session = await auth()

    if (!session) {
        redirect("/auth/signin?callbackUrl=%2Fhesabim&error=SessionRequired")
    }

    const groups = session.user?.groups ?? []
    const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"

    if (accessStatus === "ACTIVE") {
        redirect(resolveAuthHome(groups, accessStatus))
    }

    return (
        <AccountStatusPageClient
            fallbackGroups={groups}
            fallbackAccessStatus={accessStatus}
        />
    )
}
