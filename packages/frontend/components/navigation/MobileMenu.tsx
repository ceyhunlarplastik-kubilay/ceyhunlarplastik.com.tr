"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Category } from "@/features/public/categories/types";
import type { ProductAttribute } from "@/features/public/productAttributes/types";
import CustomerLeadDialog from "@/components/home/CustomerLeadDialog";
import { InquiryCartNavItem } from "@/components/navigation/InquiryCartNavItem";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";
import { serviceItems } from "@/constants/services";

export const MobileMenu = ({
    setMobileOpen,
    mobileOpen,
    categories = [],
    attributes = [],
}: {
    setMobileOpen: (open: boolean) => void;
    mobileOpen: boolean;
    categories?: Category[];
    attributes?: ProductAttribute[];
}) => {
    const t = useTranslations("chrome");

    return (
        <div
            className={`
          fixed inset-0 z-[999] 
          backdrop-blur-md bg-black/30 
          transition-all duration-300 
          ${mobileOpen
                    ? "opacity-100 pointer-events-auto"
                    : "opacity-0 pointer-events-none"
                }
        `}
            onClick={() => setMobileOpen(false)}
        >
            {/* DRAWER PANEL */}
            <div
                className={`
            absolute top-0 right-0 h-full w-[78%] max-w-sm 
            bg-white shadow-xl rounded-l-2xl 
            transform transition-transform duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)]
            ${mobileOpen ? "translate-x-0" : "translate-x-full"}
          `}
                onClick={(e) => e.stopPropagation()}
            >
                {/* CLOSE BUTTON */}
                <div className="flex items-center justify-between p-5 border-b">
                    <span className="text-lg font-semibold">{t("mobileMenu.title")}</span>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-full bg-gray-200/60 hover:bg-gray-300 transition"
                        aria-label={t("mobileMenu.closeAria")}
                    >
                        <svg viewBox="0 0 24 24" className="h-5 w-5">
                            <path
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* LINKS */}
                <nav className="flex flex-col space-y-1 p-5 text-lg font-medium overflow-y-auto h-[calc(100%-70px)]">
                    <Link
                        className="menu-item-ios py-2 border-b border-gray-100"
                        href="/hakkimizda"
                        onClick={() => setMobileOpen(false)}
                    >
                        {t("nav.corporate")}
                    </Link>

                    <details className="menu-item-ios group border-b border-gray-100">
                        <summary className="cursor-pointer py-3 flex justify-between items-center list-none">
                            {t("nav.categories")}
                            <svg
                                className="w-4 h-4 transition-transform group-open:rotate-180"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </summary>
                        <div className="ml-3 mb-2 flex flex-col gap-2 text-base text-muted-foreground">
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    className="menu-subitem-ios py-1 block"
                                    href={`/urun-kategori/${category.slug}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </details>

                    <Link
                        className="menu-item-ios py-2 border-b border-gray-100"
                        href="/urunler/filtre"
                        onClick={() => setMobileOpen(false)}
                    >
                        {t("nav.sectoralProducts")}
                    </Link>

                    <details className="menu-item-ios group border-b border-gray-100">
                        <summary className="cursor-pointer py-3 flex justify-between items-center list-none">
                            {t("nav.services")}
                            <svg
                                className="w-4 h-4 transition-transform group-open:rotate-180"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 9l-7 7-7-7"
                                />
                            </svg>
                        </summary>
                        <div className="ml-3 mb-2 flex flex-col gap-2 text-base text-muted-foreground">
                            {serviceItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className="py-1 block"
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {t(`nav.serviceItems.${item.key}.title`)}
                                </Link>
                            ))}
                        </div>
                    </details>

                    <Link
                        className="menu-item-ios py-2 border-b border-gray-100"
                        href="/kataloglar"
                        onClick={() => setMobileOpen(false)}
                    >
                        {t("nav.catalogs")}
                    </Link>

                    <Link
                        className="menu-item-ios py-2 border-b border-gray-100"
                        href="/iletisim"
                        onClick={() => setMobileOpen(false)}
                    >
                        {t("nav.contact")}
                    </Link>

                    <div className="pt-4">
                        <InquiryCartNavItem className="w-full justify-center" />
                    </div>

                    <div className="pt-2">
                        <CustomerLeadDialog
                            attributes={attributes}
                            buttonClassName="w-full justify-center"
                        />
                    </div>

                    <div className="flex justify-center pt-4">
                        <LanguageSwitcher className="text-sm" />
                    </div>
                </nav>
            </div>
        </div>
    );
};
