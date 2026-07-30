"use client"

import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    PRODUCT_FORM_DEFAULT_LOCALE,
    PRODUCT_FORM_LOCALES,
    PRODUCT_FORM_LOCALE_FLAGS,
    PRODUCT_FORM_LOCALE_LABELS,
    type ProductFormLocale,
} from "@/features/admin/products/schema/productFormSchema"

type Props = {
    value: ProductFormLocale
    onChange: (locale: ProductFormLocale) => void
    /** İçeriği olan diller: seçenekte küçük bir gösterge çıkar. */
    filledLocales?: ProductFormLocale[]
    className?: string
}

/**
 * Çeviri alanları için dil seçici.
 *
 * NEDEN SELECT: her dilin alanlarını yan yana basmak iki dilde bile kalabalıktı
 * ve dil sayısı arttıkça form okunamaz hâle geliyordu. Alanlar tek bir aktif
 * dile göre gösteriliyor; varsayılan Türkçe. Görsel dil, sitedeki
 * `components/navigation/LanguageSwitcher` ile hizalı (bayrak + select) —
 * segmented sekme yerine select, 10 dilde de aynı yeri kaplıyor.
 *
 * Diller PRODUCT_FORM_LOCALES'ten türediği için yeni dil eklemek bu bileşeni
 * değiştirmiyor.
 */
export function ProductLocaleSelect({ value, onChange, filledLocales = [], className }: Props) {
    return (
        <Select value={value} onValueChange={(next) => onChange(next as ProductFormLocale)}>
            <SelectTrigger
                size="sm"
                aria-label="Çeviri dili"
                className={cn(
                    "h-8 min-w-36 rounded-full border-neutral-200 bg-white px-2.5 text-xs font-semibold text-neutral-700 shadow-none transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:border-[var(--color-brand)] focus-visible:ring-[var(--color-brand)]/20",
                    className,
                )}
            >
                <SelectValue />
            </SelectTrigger>

            <SelectContent align="end" className="min-w-44">
                {PRODUCT_FORM_LOCALES.map((locale) => {
                    const isTargetLocale = locale !== PRODUCT_FORM_DEFAULT_LOCALE
                    const isFilled = filledLocales.includes(locale)

                    return (
                        <SelectItem key={locale} value={locale} className="text-sm">
                            <span className="text-base leading-none" aria-hidden="true">
                                {PRODUCT_FORM_LOCALE_FLAGS[locale]}
                            </span>
                            <span>{PRODUCT_FORM_LOCALE_LABELS[locale]}</span>
                            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400">
                                {locale}
                            </span>

                            {isTargetLocale ? (
                                <span
                                    aria-hidden
                                    title={isFilled ? "Çeviri girildi" : "Çeviri boş"}
                                    className={cn(
                                        "h-1.5 w-1.5 rounded-full",
                                        isFilled ? "bg-brand" : "bg-neutral-300",
                                    )}
                                />
                            ) : null}
                        </SelectItem>
                    )
                })}
            </SelectContent>
        </Select>
    )
}
