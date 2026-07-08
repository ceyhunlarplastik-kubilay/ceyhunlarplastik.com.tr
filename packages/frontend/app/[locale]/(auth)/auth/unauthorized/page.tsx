import { auth } from "@/lib/auth/auth"
import { getTranslations } from "next-intl/server"
import { AuthShell } from "@/features/auth/components/AuthShell"
import { UnauthorizedPageContent } from "@/features/auth/components/UnauthorizedPageContent"
import { resolveAuthHome } from "@/features/auth/lib/navigation"

export default async function UnauthorizedPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>
    searchParams: Promise<{ from?: string }>
}) {
    const { locale } = await params
    const session = await auth()
    const query = await searchParams
    const groups = session?.user?.groups ?? []
    const accessStatus = session?.user?.accessStatus ?? "ACTIVE"
    const t = await getTranslations({ locale, namespace: "auth.unauthorized" })

    return (
        <AuthShell
            eyebrow={t("eyebrow")}
            title={t("shellTitle")}
            description=""
            sideTitle={t("shellSideTitle")}
            sideDescription=""
        >
            <UnauthorizedPageContent homeHref={resolveAuthHome(groups, accessStatus)} from={query.from} />
        </AuthShell>
    )
}
