import Link from "next/link"
import { getTranslations } from "next-intl/server"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { resolveAuthErrorKey } from "@/features/auth/lib/errors"

type Props = {
    error?: string
}

export async function AuthErrorPanel({ error }: Props) {
    const te = await getTranslations("auth.errors")
    const t = await getTranslations("auth.errorPage")
    const key = resolveAuthErrorKey(error) ?? "Default"
    const message = { title: te(`${key}.title`), description: te(`${key}.description`) }

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
                <div className="flex items-start gap-3">
                    <div className="rounded-full bg-amber-100 p-2 text-amber-700">
                        <AlertTriangle className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="text-sm font-semibold text-amber-800">{message.title}</div>
                        <p className="mt-1 text-sm leading-6 text-amber-700">{message.description}</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap gap-3">
                <Button asChild variant="brand" size="lg" className="h-11 rounded-xl px-5">
                    <Link href="/auth/signin">{t("backToSignIn")}</Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-xl px-5">
                    <Link href="/">{t("goHome")}</Link>
                </Button>
            </div>
        </div>
    )
}
