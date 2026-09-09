import { Link } from "@/i18n/navigation"
import React from "react"

import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export type PageBreadcrumbItem = {
    label: string
    href?: string
}

type Props = {
    items?: PageBreadcrumbItem[]
}

/**
 * Sayfa üstü iz şeridi. `PageHero` bunu kullanır ama bağımsız da import
 * edilebilir (ör. banner istemeyen bir sayfa yalnız izi göstermek isteyebilir).
 * Tek satır + yatay kaydırma: uzun bir iz (ör. Ana Sayfa/Ürünler/Kategori/Ürün
 * adı) sabit yükseklikli bir banner'ı büyütmez. Her etiket kırpılır (native
 * `title` tooltip'i tam metni korur). Son öğe (`href`'siz — içinde bulunulan
 * sayfa) kalın + marka rengiyle vurgulanır.
 */
export function PageBreadcrumb({ items }: Props) {
    if (!items || items.length === 0) return null

    return (
        <nav aria-label="breadcrumb" className="border-b border-neutral-200 bg-white">
            <div className="mx-auto max-w-7xl overflow-x-auto px-6 py-3">
                <Breadcrumb>
                    <BreadcrumbList className="flex-nowrap text-xs text-neutral-700 sm:text-sm">
                        {items.map((item, index) => (
                            <React.Fragment key={index}>
                                <BreadcrumbItem className="shrink-0">
                                    {item.href ? (
                                        <BreadcrumbLink asChild>
                                            <Link
                                                href={item.href}
                                                title={item.label}
                                                className="block max-w-28 truncate sm:max-w-48 md:max-w-none"
                                            >
                                                {item.label}
                                            </Link>
                                        </BreadcrumbLink>
                                    ) : (
                                        <BreadcrumbPage
                                            className="block max-w-28 truncate font-semibold text-brand sm:max-w-48 md:max-w-none"
                                            title={item.label}
                                        >
                                            {item.label}
                                        </BreadcrumbPage>
                                    )}
                                </BreadcrumbItem>

                                {index < items.length - 1 && <BreadcrumbSeparator className="shrink-0" />}
                            </React.Fragment>
                        ))}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </nav>
    )
}
