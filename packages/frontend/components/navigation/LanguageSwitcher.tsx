"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getLocaleMetadata } from "@/i18n/localeMetadata";
import { cn } from "@/lib/utils";
import { fetchCategoryBySlug } from "@/features/public/categories/api/fetchCategories";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

/**
 * Etiketler `LOCALE_METADATA`'dan gelir ve ANA DİLDEDİR (endonym): "Deutsch"
 * her dilde "Deutsch"tur. Eskiden her dil için katalogda iki anahtar vardı
 * (`tr`/`trFull`); 14 dilde bu, katalog başına 28 anahtar demek olurdu ve
 * çevirmenin "English"i Türkçeye çevirmesi gibi anlamsız bir iş çıkarırdı.
 *
 * NOT: dil sayısı arttıkça düz `Select` uzayacak. Aranabilir listeye
 * (Command + Popover, ikisi de repoda mevcut) geçiş, dil dalgalarında liste
 * gerçekten uzadığında yapılmalı.
 */

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
    const selectedLocale = (routing.locales as readonly string[]).includes(locale)
        ? locale
        : routing.defaultLocale;

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
            <SelectContent align="end" className="min-w-36">
                {routing.locales.map((code) => {
                    const meta = getLocaleMetadata(code);

                    return (
                        <SelectItem
                            key={code}
                            value={code}
                            title={meta.label}
                            className="text-sm"
                        >
                            <span className="text-base leading-none" aria-hidden="true">
                                {meta.flag}
                            </span>
                            <span>{meta.label}</span>
                            <span className="font-mono text-xs uppercase text-neutral-500">
                                {code}
                            </span>
                        </SelectItem>
                    );
                })}
            </SelectContent>
        </Select>
    );
}
