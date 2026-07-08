import { auth } from "@/lib/auth/auth"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { AwaitingApprovalPageContent } from "@/features/auth/components/AwaitingApprovalPageContent"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function AwaitingApprovalPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ callbackUrl?: string; email?: string }>
}) {
    const { locale } = await params
    const session = await auth()
    const query = await searchParams
    const t = await getTranslations({ locale, namespace: "auth.awaiting" })

    if (session?.user?.accessStatus && session.user.accessStatus !== "PENDING_REVIEW") {
        redirect(resolveAuthHome(session.user?.groups ?? [], session.user.accessStatus))
    }

    return (
        <AuthShell
            eyebrow={t("eyebrow")}
            title={t("shellTitle")}
            description=""
            sideTitle={t("shellSideTitle")}
            sideDescription=""
        >
            <AwaitingApprovalPageContent
                callbackUrl={query.callbackUrl || "/admin"}
                email={query.email}
            />
        </AuthShell>
    )
}
