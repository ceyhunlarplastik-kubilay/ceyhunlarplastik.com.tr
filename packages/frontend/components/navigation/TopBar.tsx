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

export function TopBar() {
    return (
        <div className="w-full bg-neutral-100 border-b text-[12px] text-neutral-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[34px] flex items-center justify-between">

                {/* LEFT */}
                <div className="flex items-center gap-5">

                    {/* SOCIAL */}
                    <div className="flex items-center gap-3 text-neutral-500">
                        <Link
                            href="https://www.facebook.com/Ceyhunlarplastik/"
                            target="_blank"
                            className="hover:text-[var(--color-brand)]"
                        >
                            <SiFacebook size={14} />
                        </Link>

                        <Link
                            href="https://www.instagram.com/ceyhunlarplastik/"
                            target="_blank"
                            className="hover:text-[var(--color-brand)]"
                        >
                            <SiInstagram size={14} />
                        </Link>

                        <Link
                            href="https://www.youtube.com/@ceyhunlarplastik9455"
                            target="_blank"
                            className="hover:text-[var(--color-brand)]"
                        >
                            <SiYoutube size={14} />
                        </Link>
                    </div>

                    {/* PHONES */}
                    <div className="hidden md:flex items-center gap-4">

                        {/* FIXED PHONE */}
                        <Link
                            href="tel:+902327002946"
                            className="link-underline flex items-center gap-2 hover:text-[var(--color-brand)]"
                        >
                            <Phone size={14} />
                            0 (232) 700 29 46
                        </Link>

                        <div className="w-px h-3 bg-neutral-300" />

                        {/* WHATSAPP */}
                        <Link
                            href="https://wa.me/905530602946"
                            target="_blank"
                            className="link-underline flex items-center gap-2 hover:text-[var(--color-brand)]"
                        >
                            <SiWhatsapp size={14} className="text-green-600" />
                            0 (553) 060 29 46
                        </Link>

                    </div>

                </div>

                {/* RIGHT */}
                <div className="flex items-center gap-6">

                    <div className="flex items-center gap-1 text-black">
                        <PackageSearch className="w-3.5 h-3.5" />
                        <ProductRequestDialog className="link-underline text-black hover:text-[var(--color-brand)]" />
                    </div>

                    <div className="flex items-center gap-1 text-black">
                        <BookOpenText className="w-3.5 h-3.5" />
                        <CatalogRequestDialog className="link-underline text-black hover:text-[var(--color-brand)]" />
                    </div>

                </div>

            </div>
        </div>
    );
}