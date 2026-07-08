import { getTranslations } from "next-intl/server"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { SignOutPageClient } from "@/features/auth/components/SignOutPageClient"

export default async function SignOutPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const t = await getTranslations({ locale, namespace: "auth.signOut" })

    return (
        <AuthShell
            eyebrow={t("eyebrow")}
            title={t("shellTitle")}
            description=""
            sideTitle={t("shellSideTitle")}
            sideDescription=""
        >
            <SignOutPageClient />
        </AuthShell>
    )
}
