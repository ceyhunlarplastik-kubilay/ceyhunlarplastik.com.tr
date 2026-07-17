"use client";

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { fetchCategoryBySlug } from "@/features/public/categories/api/fetchCategories";

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
        <div
            role="group"
            aria-label={t("ariaLabel")}
            className={cn(
                "inline-flex items-center rounded-full border border-neutral-200 bg-white p-0.5 text-[11px] font-medium",
                isPending && "opacity-60",
                className
            )}
        >
            {routing.locales.map((code) => {
                const isActive = code === locale;
                return (
                    <button
                        key={code}
                        type="button"
                        onClick={() => switchTo(code)}
                        aria-current={isActive ? "true" : undefined}
                        title={code === "tr" ? t("trFull") : t("enFull")}
                        className={cn(
                            "rounded-full px-2 py-0.5 transition-colors",
                            isActive
                                ? "bg-[var(--color-brand)] text-white"
                                : "text-neutral-500 hover:text-neutral-900"
                        )}
                    >
                        {code === "tr" ? t("tr") : t("en")}
                    </button>
                );
            })}
        </div>
    );
}
