"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform, useReducedMotion } from "motion/react";
import { useRef } from "react";
import { useCategories } from "@/features/public/categories/hooks/useCategories";
import { getCategoryPrimaryImage } from "@/features/public/categories/utils/getPrimaryImage";
import { MotionMarquee } from "@/components/ui/MotionMarquee";
import type { Category } from "@/features/public/categories/types";

export function ProductsSection({
    initialCategories,
}: {
    initialCategories?: Category[];
}) {
    const t = useTranslations("home.products");
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);
    const reduce = useReducedMotion();

    // Server'dan gelen kategoriler initialData olur → client'ta ikinci /categories fetch'i gitmez.
    const { data: categories } = useCategories(initialCategories);
    const isEmpty = !categories || categories.length === 0;

    return (
        <section
            ref={containerRef}
            className="relative w-full py-16 overflow-hidden flex flex-col items-center justify-center bg-neutral-900"
        >
            {/* PARALLAX BACKGROUND */}
            {/* Parallax hareketi reduced-motion'da kapanır; y=0 zaten ortalanmış
                konum olduğu için görsel aynı yerde, sadece sabit durur. */}
            <motion.div
                className="absolute inset-0 z-0 h-[140%] top-[-20%]"
                style={reduce ? undefined : { y }}
            >
                <Image
                    src="/logos/hakkimizda.jpg" // Using an existing image as background
                    alt=""
                    aria-hidden="true"
                    fill
                    sizes="100vw"
                    className="object-cover opacity-20 grayscale"
                />
                <div className="absolute inset-0 bg-linear-to-t from-neutral-900 via-transparent to-neutral-900" />
            </motion.div>

            {/* CONTENT */}
            <div className="relative z-10 w-full">
                <div className="mb-10 text-center px-6">
                    <h2 className="text-balance text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">
                        {t("title")}
                    </h2>
                    <p className="text-pretty text-white/60 text-lg max-w-2xl mx-auto leading-relaxed">
                        {t("subtitle")}
                    </p>
                </div>

                <div className="space-y-6 w-full max-w-7xl mx-auto">
                    {/* Row 1: Right */}
                    <MotionMarquee speed={60} direction="right" gap="gap-4">
                        {isEmpty
                            ? <MarqueeSkeleton />
                            : categories?.slice(0, 6).map((item) => (
                                <MarqueeItem
                                    key={`row1-${item.id}`}
                                    item={{
                                        href: `/urun-kategori/${item.slug}`,
                                        title: item.name,
                                        src: getCategoryPrimaryImage(item) ?? "/placeholder.webp",
                                    }}
                                />
                            ))}
                    </MotionMarquee>

                    {/* Row 2: Left (Reverse) */}
                    <MotionMarquee speed={50} direction="left" gap="gap-4">
                        {isEmpty
                            ? <MarqueeSkeleton />
                            : categories?.slice(3, 9).map((item) => (
                                <MarqueeItem
                                    key={`row2-${item.id}`}
                                    item={{
                                        href: `/urun-kategori/${item.slug}`,
                                        title: item.name,
                                        src: getCategoryPrimaryImage(item) ?? "/placeholder.webp",
                                    }}
                                />
                            ))}
                    </MotionMarquee>

                    {/* Row 3: Right */}
                    <MotionMarquee speed={55} direction="right" gap="gap-4">
                        {isEmpty
                            ? <MarqueeSkeleton />
                            : categories?.slice(6, 12).map((item) => (
                                <MarqueeItem
                                    key={`row3-${item.id}`}
                                    item={{
                                        href: `/urun-kategori/${item.slug}`,
                                        title: item.name,
                                        src: getCategoryPrimaryImage(item) ?? "/placeholder.webp",
                                    }}
                                />
                            ))}
                    </MotionMarquee>
                </div>
            </div>
        </section>
    );
}

function MarqueeSkeleton({ count = 6 }: { count?: number }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <div
                    key={`sk-${i}`}
                    className="w-56 h-40 shrink-0 rounded-xl border border-white/10 bg-white/5 animate-pulse"
                    aria-hidden="true"
                />
            ))}
        </>
    );
}

function MarqueeItem({
    item,
}: {
    item: { href: string; src: string; title: string };
}) {
    return (
        <Link
            href={item.href}
            className="group relative block w-56 h-40 overflow-hidden rounded-xl shadow-2xl border border-white/10 hover:border-brand/50 transition-all duration-500 shrink-0"
        >
            {/* Kart sabit 224px (w-56); sizes olmadan Next 100vw varsayıp srcset'ten
                en büyük adayı seçiyordu. Marquee children'ı iki kez render ettiği için
                bu görsel sayısı kadar çarpan etkisi yapıyor. */}
            <Image
                src={item.src}
                alt={item.title}
                fill
                sizes="224px"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Card Overlay */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

            <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
                {/* <p className="text-brand font-medium text-xs mb-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-y-1 group-hover:translate-y-0">
          İncele
        </p> */}
                <h3 className="text-white text-sm font-bold group-hover:text-brand transition-colors text-center">
                    {item.title}
                </h3>
            </div>
        </Link>
    );
}
