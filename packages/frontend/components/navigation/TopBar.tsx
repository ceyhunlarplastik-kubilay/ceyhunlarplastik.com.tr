"use client";

import Link from "next/link";

import {
    SiFacebook,
    SiInstagram,
    SiYoutube,
    SiWhatsapp
} from "react-icons/si";

import { Phone, PackageSearch, BookOpenText } from "lucide-react";

import { ProductRequestDialog } from "@/components/dialogs/ProductRequestDialog";
import { CatalogRequestDialog } from "@/components/dialogs/CatalogRequestDialog";
import { LanguageSwitcher } from "@/components/navigation/LanguageSwitcher";

export function TopBar() {
    return (
        <div className="w-full bg-neutral-100 border-b text-[12px] text-neutral-700">
            <div className="max-w-7xl mx-auto px-3 sm:px-6 h-8.5 flex items-center justify-between gap-2">

                {/* LEFT */}
                <div className="flex min-w-0 items-center gap-3 sm:gap-5">

                    {/* SOCIAL */}
                    <div className="flex shrink-0 items-center gap-2.5 text-neutral-500 sm:gap-3">
                        <Link
                            href="https://www.facebook.com/Ceyhunlarplastik/"
                            target="_blank"
                            className="hover:text-(--color-brand)"
                        >
                            <SiFacebook size={14} />
                        </Link>

                        <Link
                            href="https://www.instagram.com/ceyhunlarplastik/"
                            target="_blank"
                            className="hover:text-(--color-brand)"
                        >
                            <SiInstagram size={14} />
                        </Link>

                        <Link
                            href="https://www.youtube.com/@ceyhunlarplastik9455"
                            target="_blank"
                            className="hover:text-(--color-brand)"
                        >
                            <SiYoutube size={14} />
                        </Link>
                    </div>

                    {/* PHONES — dar ekranda yer olmadığı için gizli, lg'den itibaren görünür */}
                    <div className="hidden lg:flex items-center gap-4">

                        {/* FIXED PHONE */}
                        <Link
                            href="tel:+902327002946"
                            className="link-underline flex items-center gap-2 hover:text-(--color-brand)"
                        >
                            <Phone size={14} />
                            0 (232) 700 29 46
                        </Link>

                        <div className="w-px h-3 bg-neutral-300" />

                        {/* WHATSAPP */}
                        <Link
                            href="https://wa.me/905530602946"
                            target="_blank"
                            className="link-underline flex items-center gap-2 hover:text-(--color-brand)"
                        >
                            <SiWhatsapp size={14} className="text-green-600" />
                            0 (553) 060 29 46
                        </Link>

                    </div>

                </div>

                {/* RIGHT — dar ekranda yalnız ikonlar (bkz. hideLabelOnMobile),
                    metinler sm:'den itibaren geri döner. */}
                <div className="flex shrink-0 items-center gap-3 sm:gap-6">

                    <div className="flex items-center gap-1 text-black">
                        <PackageSearch className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                        <ProductRequestDialog
                            hideLabelOnMobile
                            className="link-underline text-black hover:text-(--color-brand)"
                        />
                    </div>

                    <div className="flex items-center gap-1 text-black">
                        <BookOpenText className="hidden h-3.5 w-3.5 shrink-0 sm:block" />
                        <CatalogRequestDialog
                            hideLabelOnMobile
                            className="link-underline text-black hover:text-(--color-brand)"
                        />
                    </div>

                    <LanguageSwitcher />

                </div>

            </div>
        </div>
    );
}