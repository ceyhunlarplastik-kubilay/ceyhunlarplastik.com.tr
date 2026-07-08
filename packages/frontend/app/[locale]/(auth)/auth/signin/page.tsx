import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { auth } from "@/lib/auth/auth"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignInPageClient } from "@/features/auth/components/SignInPageClient"
import { canAccessPath, getCallbackPathname, resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function SignInPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ callbackUrl?: string; error?: string; email?: string; notice?: string }>
}) {
    const { locale } = await params
    const session = await auth()
    const query = await searchParams
    const callbackUrl = query.callbackUrl || "/admin"
    const t = await getTranslations({ locale, namespace: "auth.signIn" })

    if (session) {
        const groups = session.user?.groups ?? []
        const accessStatus = session.user?.accessStatus ?? "PENDING_REVIEW"
        const callbackPathname = getCallbackPathname(callbackUrl)

        if (accessStatus !== "ACTIVE") {
            redirect("/hesabim")
        }

        if (canAccessPath(groups, callbackPathname)) {
            redirect(callbackUrl)
        }

        redirect(resolveAuthHome(groups, accessStatus))
    }

    return (
        <AuthShell
            eyebrow={t("eyebrow")}
            title={t("title")}
            description=""
            sideTitle={t("sideTitle")}
            sideDescription=""
        >
            <SignInPageClient
                callbackUrl={callbackUrl}
                error={query.error}
                initialEmail={query.email}
                notice={query.notice}
            />
        </AuthShell>
    )
}
