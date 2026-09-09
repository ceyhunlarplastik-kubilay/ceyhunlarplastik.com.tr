import type { Metadata } from "next"
import Link from "next/link"
import "./globals.css"

/**
 * Next.js'te İKİ farklı "bulunamadı" mekanizması var (bkz. next.config.ts
 * yorumu): `[locale]/(public)/not-found.tsx` yalnız route İÇİNDE `notFound()`
 * ÇAĞRILDIĞINDA (ör. `/urun/olmayan-slug` — sayfa var ama veri yok) devreye
 * girer. Dosya sisteminde HİÇ eşleşmeyen bir path (ör.
 * `/urunler/olmayan-bir-sayfa`) için Next.js yalnız KÖK seviyesindeki bu
 * dosyayı kullanır — ve bu proje tek bir ortak `app/layout.tsx` taşımadığı
 * (iki ayrı kök: `[locale]/layout.tsx` + `(panels)/layout.tsx`) için `next.config.ts`'te
 * `experimental.globalNotFound` açılması ve BURADA TAM bir `<html><body>`
 * belgesi kurulması gerekiyor — normal layout ağacı (Navbar/Footer, next-intl
 * context) bu sayfayı SARMAZ, kasıtlı olarak kendi başına, hafif tutuldu.
 */
export const metadata: Metadata = {
    title: "Sayfa Bulunamadı | Ceyhunlar Plastik",
    description: "Aradığınız sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.",
}

export default function GlobalNotFound() {
    return (
        <html lang="tr">
            <body className="flex min-h-dvh items-center justify-center bg-white px-6 font-sans text-foreground">
                <div className="flex max-w-2xl flex-col items-center gap-6 py-24 text-center">
                    <p className="text-sm font-semibold tracking-[0.28em] text-brand">CEYHUNLAR PLASTİK</p>

                    <div className="space-y-2">
                        <p className="text-sm font-semibold tracking-[0.2em] text-muted-foreground">404</p>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                            Sayfa bulunamadı
                        </h1>
                        <p className="text-sm text-muted-foreground sm:text-base">
                            Aradığınız sayfa taşınmış, kaldırılmış ya da hiç var olmamış olabilir.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/"
                            className="inline-flex h-11 items-center justify-center rounded-md bg-brand px-6 text-sm font-medium text-brand-foreground transition-colors hover:bg-brand/90"
                        >
                            Ana Sayfaya Dön
                        </Link>
                        <Link
                            href="/urunler"
                            className="inline-flex h-11 items-center justify-center rounded-md border border-border px-6 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                            Ürünleri İncele
                        </Link>
                    </div>
                </div>
            </body>
        </html>
    )
}
