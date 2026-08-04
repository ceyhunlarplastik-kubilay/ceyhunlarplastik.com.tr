"use client"

import { useTransition } from "react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

import { useFilterStore } from "@/features/public/products/store/filterStore"
import { getPaginationItems } from "@/features/public/products/utils/getPaginationItems"
// Locale-aware router (EN sayfalarda /en öneki korunur; TR'de değişiklik yok).
import { useRouter } from "@/i18n/navigation"

type Props = {
    page: number
    totalPages: number
    basePath?: string
}

export default function ProductFilterPagination({ page, totalPages, basePath = "/urunler/filtre" }: Props) {
    const t = useTranslations("public.productFilter")
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    const { setPage, toQueryString } = useFilterStore()

    if (totalPages <= 1) return null

    // Tüm sayfaları yan yana basmak yerine pencereli liste: 1 … 4 [5] 6 … 20
    const items = getPaginationItems(page, totalPages)

    function go(pageNum: number) {
        const target = Math.min(Math.max(pageNum, 1), totalPages)
        if (target === page) return

        setPage(target)

        startTransition(() => {
            router.replace(`${basePath}?${toQueryString()}`)
        })
    }

    return (
        <nav
            aria-label={t("paginationLabel")}
            className="mt-8 flex items-center justify-center gap-2"
        >
            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => go(page - 1)}
                disabled={page <= 1 || isPending}
                aria-label={t("previousPage")}
            >
                <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
            </Button>

            {/* Mobilde sayfa numaraları yerine kompakt gösterim */}
            <span className="px-3 text-sm font-medium text-neutral-700 sm:hidden">
                {t("pageOf", { page, totalPages })}
            </span>

            <ul className="hidden items-center gap-1.5 sm:flex">
                {items.map((item) =>
                    typeof item === "number" ? (
                        <li key={item}>
                            <motion.div whileTap={{ scale: 0.92 }}>
                                <Button
                                    type="button"
                                    onClick={() => go(item)}
                                    disabled={isPending}
                                    variant={item === page ? "default" : "outline"}
                                    aria-label={t("goToPage", { page: item })}
                                    aria-current={item === page ? "page" : undefined}
                                    className={cn("min-w-10 tabular-nums", item === page && "pointer-events-none")}
                                >
                                    {item}
                                </Button>
                            </motion.div>
                        </li>
                    ) : (
                        <li
                            key={item}
                            aria-hidden="true"
                            className="px-1 text-neutral-400 select-none"
                        >
                            &hellip;
                        </li>
                    ),
                )}
            </ul>

            <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => go(page + 1)}
                disabled={page >= totalPages || isPending}
                aria-label={t("nextPage")}
            >
                <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
            </Button>
        </nav>
    )
}
