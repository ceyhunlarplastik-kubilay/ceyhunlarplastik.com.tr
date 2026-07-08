import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"

type Props = {
    homeHref: string
    from?: string
}

export function UnauthorizedPageContent({ homeHref, from }: Props) {
    const t = useTranslations("auth.unauthorized")
    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="error"
                title={t("infoTitle")}
                description={t("infoDescription")}
            />

            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm leading-6 text-slate-600">
                {t("requestedAreaLabel")} <span className="font-medium text-slate-800">{from ?? t("unknown")}</span>
            </div>

            <div className="flex flex-wrap gap-3">
                {/* homeHref panel içi (locale dışı) rota; next/link doğru */}
                <Button asChild variant="brand" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={homeHref}>{t("goToPanel")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href="/">{t("goHome")}</Link>
                </Button>
            </div>
        </div>
    )
}
