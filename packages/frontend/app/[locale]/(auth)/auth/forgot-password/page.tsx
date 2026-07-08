import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { ForgotPasswordPageClient } from "@/features/auth/components/ForgotPasswordPageClient"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function ForgotPasswordPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ callbackUrl?: string; email?: string }>
}) {
    const { locale } = await params
    const session = await auth()
    const query = await searchParams
    const callbackUrl = query.callbackUrl || "/admin"
    const t = await getTranslations({ locale, namespace: "auth.forgotPassword" })

    if (session) {
        redirect(resolveAuthHome(session.user?.groups ?? [], session.user?.accessStatus ?? "ACTIVE"))
    }

    return (
        <AuthShell
            eyebrow={t("eyebrow")}
            title={t("shellTitle")}
            description=""
            sideTitle={t("shellSideTitle")}
            sideDescription=""
        >
            <ForgotPasswordPageClient callbackUrl={callbackUrl} initialEmail={query.email} />
        </AuthShell>
    )
}
