import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { AwaitingApprovalPageContent } from "@/features/auth/components/AwaitingApprovalPageContent"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function AwaitingApprovalPage({
    searchParams,
}: {
    searchParams: Promise<{ callbackUrl?: string; email?: string }>
}) {
    const session = await auth()
    const params = await searchParams

    if (session?.user?.accessStatus && session.user.accessStatus !== "PENDING_REVIEW") {
        redirect(resolveAuthHome(session.user?.groups ?? [], session.user.accessStatus))
    }

    return (
        <AuthShell
            eyebrow="Ceyhunlar"
            title="Yetkilendirme bekleniyor"
            description=""
            sideTitle="Hesabınız oluşturuldu"
            sideDescription=""
        >
            <AwaitingApprovalPageContent
                callbackUrl={params.callbackUrl || "/admin"}
                email={params.email}
            />
        </AuthShell>
    )
}
