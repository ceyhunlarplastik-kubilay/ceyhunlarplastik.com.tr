import { Link } from "@/i18n/navigation"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { AuthFeedbackMessage } from "@/features/auth/components/AuthFeedbackMessage"

type Props = {
    callbackUrl: string
    email?: string
}

export function AwaitingApprovalPageContent({ callbackUrl, email }: Props) {
    const t = useTranslations("auth.awaiting")
    return (
        <div className="space-y-6">
            <AuthFeedbackMessage
                variant="info"
                title={t("infoTitle")}
                description={t("infoDescription")}
            />

            {email ? (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-600">
                    {t.rich("emailNotice", {
                        email,
                        strong: (chunks) => <span className="font-medium text-slate-900">{chunks}</span>,
                    })}
                </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
                <Button asChild variant="brand" size="lg" className="h-11 rounded-xl px-5">
                    <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}&email=${encodeURIComponent(email ?? "")}`}>
                        {t("backToSignIn")}
                    </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href="/">
                        {t("goHome")}
                    </Link>
                </Button>
            </div>
        </div>
    )
}
