"use client";

import Link from "next/link";
import { categoryItems } from "@/constants/products";

export const MobileMenu = ({
    setMobileOpen,
    mobileOpen,
}: {
    setMobileOpen: (open: boolean) => void;
    mobileOpen: boolean;
}) => {
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
                    <span className="text-lg font-semibold">Menü</span>
                    <button
                        onClick={() => setMobileOpen(false)}
                        className="p-2 rounded-full bg-gray-200/60 hover:bg-gray-300 transition"
                        aria-label="Close Menu"
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
                        Kurumsal
                    </Link>

                    <details className="menu-item-ios group border-b border-gray-100">
                        <summary className="cursor-pointer py-3 flex justify-between items-center list-none">
                            Ürünler
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
                            {categoryItems.map((c) => (
                                <Link
                                    key={c.title}
                                    className="menu-subitem-ios py-1 block"
                                    href={c.href}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    {c.title}
                                </Link>
                            ))}
                        </div>
                    </details>

                    <details className="menu-item-ios group border-b border-gray-100">
                        <summary className="cursor-pointer py-3 flex justify-between items-center list-none">
                            Hizmetler
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
                            <Link
                                href="#"
                                className="py-1 block"
                                onClick={() => setMobileOpen(false)}
                            >
                                Özel Tasarım
                            </Link>
                            <Link
                                href="#"
                                className="py-1 block"
                                onClick={() => setMobileOpen(false)}
                            >
                                Lojistik
                            </Link>
                            <Link
                                href="#"
                                className="py-1 block"
                                onClick={() => setMobileOpen(false)}
                            >
                                Danışmanlık
                            </Link>
                        </div>
                    </details>

                    <details className="menu-item-ios group border-b border-gray-100">
                        <summary className="cursor-pointer py-3 flex justify-between items-center list-none">
                            Kaynaklar
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
                            <Link
                                href="/katalog"
                                className="py-1 block"
                                onClick={() => setMobileOpen(false)}
                            >
                                Ürün Kataloğu
                            </Link>
                            <Link
                                href="/dokumanlar"
                                className="py-1 block"
                                onClick={() => setMobileOpen(false)}
                            >
                                Teknik Dökümanlar
                            </Link>
                        </div>
                    </details>

                    <Link
                        className="menu-item-ios py-2 border-b border-gray-100"
                        href="/iletisim"
                        onClick={() => setMobileOpen(false)}
                    >
                        İletişim
                    </Link>
                </nav>
            </div>
        </div>
    );
};
