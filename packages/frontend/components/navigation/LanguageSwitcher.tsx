"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { fetchCategoryBySlug } from "@/features/public/categories/api/fetchCategories";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const languageOptions = {
    tr: {
        flag: "🇹🇷",
        shortLabelKey: "tr",
        fullLabelKey: "trFull",
    },
    en: {
        flag: "🇬🇧",
        shortLabelKey: "en",
        fullLabelKey: "enFull",
    },
} as const;

type LanguageCode = keyof typeof languageOptions;

function getLanguageOption(code: string) {
    return languageOptions[code as LanguageCode] ?? languageOptions.tr;
}

/**
 * Dil değiştirici. Mevcut yolu koruyarak locale değiştirir:
 * usePathname (i18n) locale-prefix'siz iç yolu döndürür, router.replace ise
 * hedef locale ile doğru URL'i kurar (TR prefixsiz, EN /en'li).
 *
 * Dinamik segmentli rotalarda ([slug] vb.) next-intl'in çözümlenmiş yolu
 * kullanabilmesi için `params` router.replace'e geçirilir.
 */
export function LanguageSwitcher({ className }: { className?: string }) {
    const t = useTranslations("chrome.languageSwitcher");
    const locale = useLocale();
    const pathname = usePathname();
    const params = useParams();
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const selectedLocale = locale in languageOptions ? locale : routing.defaultLocale;

    function switchTo(nextLocale: string) {
        if (nextLocale === locale || isPending) return;

        startTransition(async () => {
            if (
                pathname.startsWith("/urun-kategori/") &&
                typeof params.slug === "string"
            ) {
                try {
                    const category = await fetchCategoryBySlug(params.slug, locale);
                    const targetSlug = category.alternateSlugs[nextLocale] ?? params.slug;
                    router.replace(`/urun-kategori/${targetSlug}`, { locale: nextLocale });
                    return;
                } catch {
                    // Genel locale geçişi aşağıdaki mevcut rota davranışına düşer.
                }
            }

            // @ts-expect-error -- next-intl kabul eder; params tipi rota-özel
            router.replace({ pathname, params }, { locale: nextLocale });
        });
    }

    return (
        <Select
            value={selectedLocale}
            onValueChange={switchTo}
            disabled={isPending}
        >
            <SelectTrigger
                size="sm"
                aria-label={t("ariaLabel")}
                className={cn(
                    "h-8 rounded-full border-neutral-200 bg-white px-2.5 text-[11px] font-semibold text-neutral-700 shadow-none transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:border-[var(--color-brand)] focus-visible:ring-[var(--color-brand)]/20",
                    isPending && "opacity-60",
                    className
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent align="end" className="min-w-[9rem]">
                {routing.locales.map((code) => {
                    const option = getLanguageOption(code);

                    return (
                        <SelectItem
                            key={code}
                            value={code}
                            title={t(option.fullLabelKey)}
                            className="text-sm"
                        >
                            <span className="text-base leading-none" aria-hidden="true">
                                {option.flag}
                            </span>
                            <span>{t(option.fullLabelKey)}</span>
                            <span className="text-xs text-neutral-500">
                                {t(option.shortLabelKey)}
                            </span>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
