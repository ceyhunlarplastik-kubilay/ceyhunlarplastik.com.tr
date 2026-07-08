import { getTranslations } from "next-intl/server"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { AuthErrorPanel } from "@/features/auth/components/AuthErrorPanel"

export default async function AuthErrorPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ error?: string }>
}) {
    const { locale } = await params
    const query = await searchParams
    const t = await getTranslations({ locale, namespace: "auth.errorPage" })

    return (
        <AuthShell
            eyebrow={t("eyebrow")}
            title={t("shellTitle")}
            description=""
            sideTitle={t("shellSideTitle")}
            sideDescription=""
        >
            <AuthErrorPanel error={query.error} />
        </AuthShell>
    )
}
