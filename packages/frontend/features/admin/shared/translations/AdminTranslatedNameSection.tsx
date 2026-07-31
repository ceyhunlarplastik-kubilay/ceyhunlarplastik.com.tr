"use client"

import type { ReactNode } from "react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AdminLocaleSelect } from "./AdminLocaleSelect"
import {
    ADMIN_DEFAULT_LOCALE,
    adminLocaleLabel,
    adminTranslationIndex,
    type AdminLocale,
} from "./adminLocales"
import {
    filledTranslationLocales,
    NAME_TRANSLATION_MAX_LENGTH,
    type NameTranslationFormValues,
} from "./nameTranslations"

type Props = {
    /** "Renk adı", "Kategori adı" — dil adının ardına eklenir. */
    entityLabel: string
    activeLocale: AdminLocale
    onActiveLocaleChange: (locale: AdminLocale) => void
    translations: NameTranslationFormValues[]
    onTranslationsChange: (translations: NameTranslationFormValues[]) => void
    /** Varsayılan dilin alanı: kaydın kendi `name` input'u, formun kendisinden gelir. */
    defaultLocaleField: ReactNode
    targetPlaceholder?: string
    disabled?: boolean
    /**
     * `card` (varsayılan): çerçeveli kutu — dialog'larda alanı görsel olarak gruplar.
     * `plain`: çerçevesiz — komşuları çıplak input olan DAR satır-içi ızgaralarda
     * (ör. değer ekleme araç çubuğu) kutu hem daha uzun durup hizayı bozuyor hem de
     * gereksiz ağırlık katıyor.
     */
    variant?: "card" | "plain"
}

/**
 * Bir kaydın çok dilli AD alanı — 6 admin formunun ortak parçası.
 *
 * Tek bir aktif dil gösterilir; varsayılan olarak Türkçe gelir. Bu, 14 dilde
 * formu okunabilir tutmanın tek yolu: alanları yan yana basmak iki dilde bile
 * kalabalıktı.
 *
 * Varsayılan dilin alanı kaydın KENDİ kolonudur (`name`) ve formun kendi
 * input'u olarak dışarıdan verilir; hedef diller `translations` dizisine yazar.
 * Bu ayrım backend'in veri modeliyle birebir aynı ve payload üretimini
 * (`buildNameTranslationsPayload`) tek kurala indiriyor.
 */
export function AdminTranslatedNameSection({
    entityLabel,
    activeLocale,
    onActiveLocaleChange,
    translations,
    onTranslationsChange,
    defaultLocaleField,
    targetPlaceholder,
    disabled,
    variant = "card",
}: Props) {
    const isDefaultLocale = activeLocale === ADMIN_DEFAULT_LOCALE
    const index = adminTranslationIndex(activeLocale)
    const localeLabel = adminLocaleLabel(activeLocale)
    const current = index >= 0 ? translations[index] : undefined
    const isPlain = variant === "plain"

    function updateName(name: string) {
        if (index < 0) return
        onTranslationsChange(
            translations.map((translation, position) =>
                position === index ? { ...translation, name } : translation,
            ),
        )
    }

    return (
        <div
            className={cn(
                "min-w-0",
                isPlain
                    ? "space-y-1.5"
                    : "space-y-3 rounded-lg border border-neutral-200 bg-neutral-50/60 p-3",
            )}
        >
            <div className="flex items-center justify-between gap-2">
                <span
                    className={cn(
                        "truncate font-semibold uppercase tracking-wide",
                        isPlain
                            ? "text-[11px] text-neutral-400"
                            : "text-xs text-neutral-500",
                    )}
                >
                    {isPlain ? "Çeviri dili" : entityLabel}
                </span>
                <AdminLocaleSelect
                    value={activeLocale}
                    onChange={onActiveLocaleChange}
                    filledLocales={filledTranslationLocales(translations)}
                    className={isPlain ? "h-7 min-w-28 px-2 text-[11px]" : undefined}
                />
            </div>

            {isDefaultLocale ? (
                defaultLocaleField
            ) : (
                <div className={isPlain ? "space-y-1" : "space-y-2"}>
                    <div className="space-y-1.5">
                        <Label htmlFor={`translated-name-${activeLocale}`}>
                            {localeLabel} {entityLabel.toLocaleLowerCase("tr-TR")}
                        </Label>
                        <Input
                            id={`translated-name-${activeLocale}`}
                            value={current?.name ?? ""}
                            onChange={(event) => updateName(event.target.value)}
                            maxLength={NAME_TRANSLATION_MAX_LENGTH}
                            placeholder={targetPlaceholder}
                            disabled={disabled}
                        />
                    </div>
                    <p
                        className={cn(
                            "text-neutral-500",
                            isPlain ? "text-[11px] leading-4" : "text-xs leading-5",
                        )}
                    >
                        {isPlain
                            ? `Boş bırakılırsa ${localeLabel} çevirisi oluşturulmaz.`
                            : `Boş bırakılırsa ${localeLabel} çevirisi oluşturulmaz, o dilde Türkçe içerik gösterilir. Dolu bir alanı silip kaydederseniz çeviri kaldırılır.`}
                    </p>
                </div>
            )}
        </div>
    )
}
