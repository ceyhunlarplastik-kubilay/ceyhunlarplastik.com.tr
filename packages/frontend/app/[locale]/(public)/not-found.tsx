import { SearchX } from "lucide-react"
import { getTranslations } from "next-intl/server"
import { Link } from "@/i18n/navigation"
import { Button } from "@/components/ui/button"

/**
 * `[locale]/(public)` ağacında eşleşmeyen bir route için render edilir —
 * `Navbar`/`Footer` (bkz. `(public)/layout.tsx`) korunur, Next.js'in
 * varsayılan çıplak 404'ü yerine sitenin kendi görünümü gösterilir.
 * `not-found.tsx` route params ALMAZ; next-intl yine de doğru locale'i
 * çözer çünkü `getRequestConfig` (`i18n/request.ts`) `requestLocale`'i
 * middleware'den okur, `params` prop'una ihtiyaç duymaz.
 */
export default async function PublicNotFound() {
    const t = await getTranslations("shared.errors.notFound")

    return (
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 px-6 py-24 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-brand/10 text-brand">
                <SearchX className="size-8" aria-hidden="true" />
            </div>

            <div className="space-y-2">
                <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">404</p>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                    {t("title")}
                </h1>
                <p className="text-sm text-muted-foreground sm:text-base">{t("description")}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
                <Button asChild size="lg" variant="brand">
                    <Link href="/">{t("homeCta")}</Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                    <Link href="/urunler">{t("productsCta")}</Link>
                </Button>
            </div>
        </div>
    )
}
