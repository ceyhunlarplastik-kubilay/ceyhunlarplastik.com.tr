import type { ComponentProps } from "react"
import { cn } from "@/lib/utils"

/**
 * `PageHero`'dan (breadcrumb + banner) sonra gelen standart içerik konteyneri.
 * Genişlik/kenar boşluğu/üst boşluk site genelinde TEK yerden kontrol edilir —
 * daha önce her public sayfa kendi `max-w-[1400px]`/`max-w-7xl`,
 * `px-4 sm:px-6 lg:px-8`/`px-6` ve `py-6`..`py-20` kombinasyonunu elle
 * yazıyordu, sonuç hem hizasız hem de sayfadan sayfaya farklıydı (LOG'da
 * "PageHero sonrası boşluk standardı" notu). `max-w-7xl`, `PageBreadcrumb`/
 * `PageHeroBanner`'ın iç konteynerle AYNI genişlik — hero ile içerik alt alta
 * hizalanır. Farklı bir üst/alt boşluk gereken tekil durumlar (ör. birbirine
 * bitişik iki section) `className` ile üzerine yazılabilir (`cn`/`tailwind-merge`
 * çakışan `py-*`/`px-*` class'ını doğru çözer).
 */
export function PageSection({ className, children, ...props }: ComponentProps<"section">) {
    return (
        <section className={cn("mx-auto max-w-7xl px-6 pb-12 pt-4", className)} {...props}>
            {children}
        </section>
    )
}
