import { getTranslations } from "next-intl/server"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { Link } from "@/i18n/navigation"
import { cn } from "@/lib/utils"
import { getPaginationItems } from "@/features/public/products/utils/getPaginationItems"
import type { VariantTableMeta } from "@/features/public/products/server/getProductVariantTable"

/**
 * Varyant tablosunun altı: kesilme uyarısı ve (varsa) ölçü sayfalaması.
 *
 * Tablonun satırı ÖLÇÜDÜR (bkz. groupVariantTableRows), bu yüzden sayfalama da
 * ölçü üzerindedir — "sayfa 2" bir sonraki ölçü grubunu getirir.
 *
 * Sayfalama BAĞLANTI tabanlıdır (istemci durumu yok): sunucuda render edilir,
 * paylaşılabilir ve tarayıcı geri tuşu çalışır. `ProductFilterPagination`
 * yeniden kullanılamadı — o `useFilterStore`'a bağlı ve ürün filtresine özel.
 *
 * `basePath` verilmezse sayfalama GİZLENİR ve yalnız uyarı gösterilir: public
 * ürün detay sayfası `generateStaticParams` + `revalidate` ile ISR'dedir ve
 * `searchParams` okumak onu tamamen dinamik render'a düşürürdü (AGENTS.md public
 * SSR/SEO kuralı). Orada kesilme sessiz kalmasın diye uyarı yeter — satır birimi
 * ölçü olduğu için sınırın aşılması pratikte çok uzak bir ihtimal.
 */
type Props = {
    meta: VariantTableMeta
    shownCount: number
    /** Sayfa bağlantılarının temel yolu (ör. `/musteri/tum-urunler/urun/kol`). */
    basePath?: string
}

export async function VariantTableFooter({ meta, shownCount, basePath }: Props) {
    const t = await getTranslations("public.productVariant.table")

    const isTruncated = meta.total > shownCount && meta.totalPages <= 1
    const hasPagination = Boolean(basePath) && meta.totalPages > 1

    if (!isTruncated && !hasPagination) return null

    return (
        <div className="mt-4 space-y-3">
            {isTruncated ? (
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    {t("showingOf", { total: meta.total, shown: shownCount })}
                </p>
            ) : null}

            {hasPagination ? (
                <nav aria-label={t("paginationLabel")} className="flex flex-wrap items-center gap-1">
                    <PageLink
                        basePath={basePath!}
                        page={meta.page - 1}
                        disabled={meta.page <= 1}
                        label={t("previousPage")}
                    >
                        <ChevronLeft className="size-4" />
                    </PageLink>

                    {getPaginationItems(meta.page, meta.totalPages).map((item, index) =>
                        typeof item === "string" ? (
                            <span key={`${item}-${index}`} className="px-2 text-neutral-400">
                                …
                            </span>
                        ) : (
                            <PageLink
                                key={item}
                                basePath={basePath!}
                                page={item}
                                isCurrent={item === meta.page}
                                label={String(item)}
                            >
                                {item}
                            </PageLink>
                        ),
                    )}

                    <PageLink
                        basePath={basePath!}
                        page={meta.page + 1}
                        disabled={meta.page >= meta.totalPages}
                        label={t("nextPage")}
                    >
                        <ChevronRight className="size-4" />
                    </PageLink>
                </nav>
            ) : null}
        </div>
    )
}

function PageLink({
    basePath,
    page,
    label,
    children,
    isCurrent = false,
    disabled = false,
}: {
    basePath: string
    page: number
    label: string
    children: React.ReactNode
    isCurrent?: boolean
    disabled?: boolean
}) {
    const className = cn(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition-colors",
        isCurrent
            ? "border-transparent bg-primary text-primary-foreground"
            : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
        disabled && "pointer-events-none opacity-40",
    )

    if (disabled) {
        return (
            <span aria-hidden className={className}>
                {children}
            </span>
        )
    }

    return (
        <Link
            href={`${basePath}?page=${page}`}
            aria-label={label}
            aria-current={isCurrent ? "page" : undefined}
            className={className}
        >
            {children}
        </Link>
    )
}
