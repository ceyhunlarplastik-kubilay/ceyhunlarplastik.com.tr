"use client"

import { useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { useTranslations } from "next-intl"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

/**
 * `[locale]/(public)` ağacında render sırasında atılan hatayı yakalayan
 * route segment error boundary'si — Next.js gereği CLIENT component olmalı
 * (`error`/`reset` yalnız client'a geçer). Üst layout (`Navbar`/`Footer`)
 * korunur, yalnız `{children}` bu ekranla değişir.
 */
export default function PublicError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    const t = useTranslations("shared.errors.serverError")

    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="size-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {t("title")}
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">{t("description")}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button type="button" size="lg" variant="brand" onClick={() => reset()}>
                    {t("retryCta")}
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/">{t("homeCta")}</Link>
                </Button>
            </div>
        </div>
    )
}
