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
    ADMIN_DEFAULT_LOCALE,
    ADMIN_LOCALES,
    adminLocaleFlag,
    adminLocaleLabel,
    type AdminLocale,
} from "./adminLocales"

type Props = {
    value: AdminLocale
    onChange: (locale: AdminLocale) => void
    /** İçeriği olan diller: seçenekte küçük bir gösterge çıkar. */
    filledLocales?: readonly string[]
    className?: string
}

/**
 * Çeviri alanları için dil seçici — tüm admin formlarının ortak parçası.
 *
 * NEDEN SELECT: her dilin alanlarını yan yana basmak iki dilde bile kalabalıktı;
 * 14 dilde form okunamaz olurdu. Alanlar tek bir aktif dile göre gösterilir ve
 * varsayılan Türkçe gelir. Görsel dil sitedeki `LanguageSwitcher` ile hizalı
 * (bayrak + select) — segmented sekmenin aksine dil sayısından bağımsız olarak
 * aynı yeri kaplıyor.
 */
export function AdminLocaleSelect({ value, onChange, filledLocales = [], className }: Props) {
    return (
        <Select value={value} onValueChange={(next) => onChange(next as AdminLocale)}>
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

            <SelectContent align="end" className="max-h-72 min-w-44">
                {ADMIN_LOCALES.map((locale) => {
                    const isTargetLocale = locale !== ADMIN_DEFAULT_LOCALE
                    const isFilled = filledLocales.includes(locale)

                    return (
                        <SelectItem key={locale} value={locale} className="text-sm">
                            <span className="text-base leading-none" aria-hidden="true">
                                {adminLocaleFlag(locale)}
                            </span>
                            <span>{adminLocaleLabel(locale)}</span>
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
