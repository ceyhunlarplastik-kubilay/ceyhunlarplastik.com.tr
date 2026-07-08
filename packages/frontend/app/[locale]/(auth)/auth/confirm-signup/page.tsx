import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { ConfirmSignUpPageClient } from "@/features/auth/components/ConfirmSignUpPageClient"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function ConfirmSignUpPage({
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
    const t = await getTranslations({ locale, namespace: "auth.confirmSignUp" })

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
            <ConfirmSignUpPageClient callbackUrl={callbackUrl} initialEmail={query.email} />
        </AuthShell>
    )
}
