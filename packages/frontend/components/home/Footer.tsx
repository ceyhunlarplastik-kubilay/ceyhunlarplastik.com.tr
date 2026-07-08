"use client";

import Image from "next/image";
// Dış (sosyal medya) linkler next/link'te kalır; iç linkler locale-aware Link kullanır.
import ExternalLink from "next/link";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCategories } from "@/features/public/categories/hooks/useCategories";
import { Phone, MapPin } from "lucide-react";
import { SiFacebook, SiInstagram, SiYoutube } from "react-icons/si";
import { ProductRequestDialog } from "@/components/dialogs/ProductRequestDialog";
import { CatalogRequestDialog } from "@/components/dialogs/CatalogRequestDialog";
import { MailDialog } from "@/components/dialogs/MailDialog";

export function Footer() {
    const t = useTranslations("chrome.footer");
    const { data, isLoading, error } = useCategories();

    return (
        <footer className="bg-[#1f2428] text-white/80">
            {/* Top */}
            <div className="mx-auto max-w-7xl px-6 py-14">
                <div className="grid gap-x-8 gap-y-12 lg:grid-cols-6 text-[13px] text-center lg:text-left">
                    {/* Logo & description */}
                    <div className="lg:col-span-2 flex flex-col items-center lg:items-start">
                        <Image
                            src="/logos/logo-text.png"
                            alt={t("logoAlt")}
                            width={140}
                            height={35}
                            className="mb-4"
                        />

                        <p className="max-w-xs text-xs leading-relaxed text-white/70">
                            {t("description")}
                        </p>

                        {/* Social */}
                        <div className="mt-5 flex items-center justify-center lg:justify-start gap-4">
                            <ExternalLink
                                href="https://www.facebook.com/Ceyhunlarplastik/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Facebook"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[var(--color-brand)] hover:text-white"
                            >
                                <SiFacebook className="h-4 w-4" />
                            </ExternalLink>
                            <ExternalLink
                                href="https://www.instagram.com/ceyhunlarplastik/"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Instagram"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[var(--color-brand)] hover:text-white"
                            >
                                <SiInstagram className="h-4 w-4" />
                            </ExternalLink>
                            <ExternalLink
                                href="https://www.youtube.com/@ceyhunlarplastik9455"
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="YouTube"
                                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/60 transition hover:bg-[var(--color-brand)] hover:text-white"
                            >
                                <SiYoutube className="h-4 w-4" />
                            </ExternalLink>
                        </div>
                    </div>

                    {/* Kurumsal */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-white">{t("corporateTitle")}</h4>
                        <ul className="space-y-1.5 text-white/70">
                            <li>
                                <Link
                                    href="/hakkimizda"
                                    className="hover:text-[var(--color-brand)]"
                                >
                                    {t("aboutLink")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/urunler" className="hover:text-[var(--color-brand)]">
                                    {t("productionGroupsLink")}
                                </Link>
                            </li>
                            <li>
                                <Link href="/ik" className="hover:text-[var(--color-brand)]">
                                    {t("hrLink")}
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[var(--color-brand)]">
                                    {t("sustainabilityLink")}
                                </Link>
                            </li>
                            <li>
                                <Link href="#" className="hover:text-[var(--color-brand)]">
                                    {t("contactLink")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Hizmetler */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-white">{t("servicesTitle")}</h4>
                        <ul className="space-y-1.5 text-white/70">
                            <li>
                                <Link
                                    href="/arge-ve-prototipleme"
                                    className="hover:text-[var(--color-brand)]"
                                >
                                    {t("rndLink")}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/3d-baski-ve-tarama"
                                    className="hover:text-[var(--color-brand)]"
                                >
                                    {t("printing3dLink")}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/talasli-imalat"
                                    className="hover:text-[var(--color-brand)]"
                                >
                                    {t("machiningLink")}
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/seri-uretim"
                                    className="hover:text-[var(--color-brand)]"
                                >
                                    {t("massProductionLink")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Ürünler */}
                    <div className="flex flex-col items-center lg:items-start">
                        <h4 className="mb-3 text-sm font-semibold text-white text-center lg:text-left">
                            {t("productsTitle")}
                        </h4>

                        <ul className="space-y-1.5 text-white/70 w-full">
                            {data?.slice(0, 5).map((category) => (
                                <li key={category.id}>
                                    <Link
                                        href={`/urun-kategori/${category.slug}`}
                                        className="flex items-center justify-center gap-2 lg:justify-start hover:text-white transition"
                                    >
                                        {/* CODE */}
                                        <span className="text-white/50 font-medium">
                                            {category.code}.
                                        </span>

                                        {/* NAME */}
                                        <span>{category.name}</span>
                                    </Link>
                                </li>
                            ))}

                            <li className="pt-1 text-center lg:text-left">
                                <Link
                                    href="/urunler/filtre"
                                    className="text-white/50 hover:text-white transition"
                                >
                                    {t("sectoralProductsLink")}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="mb-3 text-sm font-semibold text-white">
                            {t("contactTitle")}
                        </h4>

                        <ul className="space-y-2 text-white/70">
                            <li className="flex items-center justify-center lg:justify-start gap-2">
                                <Phone className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                                (0 232) 700 29 46
                            </li>
                            <li className="flex items-center justify-center lg:justify-start gap-2">
                                <Phone className="h-3.5 w-3.5 text-[var(--color-brand)]" />
                                (0 553) 060 29 46
                            </li>
                            <li className="flex items-center justify-center lg:justify-start gap-2">
                                <ProductRequestDialog />
                            </li>
                            <li className="flex items-center justify-center lg:justify-start gap-2">
                                <CatalogRequestDialog />
                            </li>
                            <li className="flex items-center justify-center lg:justify-start gap-2">
                                <MailDialog />
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Soft divider (NO harsh white line) */}
            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

            {/* Bottom */}
            <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-[11px] text-white/70 text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-2">
                    <MapPin className="h-3.5 w-3.5" />
                    {t("address")}
                </div>

                <div>{t("copyright")}</div>
            </div>
        </footer>
    );
}
