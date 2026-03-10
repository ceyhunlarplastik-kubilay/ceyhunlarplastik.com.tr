"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
// import { useCategories } from "@/hooks/categories/useCategory";
import { useCategories } from "@/features/public/categories/hooks/useCategories";
import { MotionMarquee } from "@/components/ui/MotionMarquee";

export function ProductsSection() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start end", "end start"],
    });

    const y = useTransform(scrollYProgress, [0, 1], ["-20%", "20%"]);

    const { data: categories, isLoading, error } = useCategories();

    return (
        <section
            ref={containerRef}
            className="relative w-full py-16 overflow-hidden flex flex-col items-center justify-center bg-neutral-900"
        >
            {/* PARALLAX BACKGROUND */}
            <motion.div
                className="absolute inset-0 z-0 h-[140%] -top-[20%]"
                style={{ y }}
            >
                <Image
                    src="/logos/hakkimizda.jpg" // Using an existing image as background
                    alt="Background Pattern"
                    fill
                    className="object-cover opacity-20 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-neutral-900" />
            </motion.div>

            {/* CONTENT */}
            <div className="relative z-10 w-full">
                <div className="mb-8 text-center px-6">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Ürünlerimiz
                    </h2>
                    <p className="text-white/60 text-lg max-w-2xl mx-auto">
                        Geniş ürün yelpazemiz ve yüksek üretim kapasitemiz ile her sektöre
                        özel çözümler sunuyoruz.
                    </p>
                </div>

                <div className="space-y-6 w-full max-w-7xl mx-auto">
                    {/* Row 1: Right */}
                    <MotionMarquee speed={60} direction="right" gap="gap-4">
                        {categories?.slice(0, 6).map((item, i) => (
                            <MarqueeItem
                                key={`row1-${item.id}`}
                                item={{
                                    href: `/category/${item.id}`,
                                    title: item.name,
                                    src: `/categories/img/${item.code}.jpg`,
                                }}
                            />
                        ))}
                    </MotionMarquee>

                    {/* Row 2: Left (Reverse) */}
                    <MotionMarquee speed={50} direction="left" gap="gap-4">
                        {categories?.slice(3, 9).map((item, i) => (
                            <MarqueeItem
                                key={`row2-${item.id}`}
                                item={{
                                    href: `/category/${item.id}`,
                                    title: item.name,
                                    src: `/categories/img/${item.code}.jpg`,
                                }}
                            />
                        ))}
                    </MotionMarquee>

                    {/* Row 3: Right */}
                    <MotionMarquee speed={55} direction="right" gap="gap-4">
                        {categories?.slice(6, 12).map((item, i) => (
                            <MarqueeItem
                                key={`row3-${item.id}`}
                                item={{
                                    href: `/category/${item.id}`,
                                    title: item.name,
                                    src: `/categories/img/${item.code}.jpg`,
                                }}
                            />
                        ))}
                    </MotionMarquee>
                </div>
            </div>
        </section>
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
            className="group relative block w-56 h-40 overflow-hidden rounded-xl shadow-2xl border border-white/10 hover:border-brand/50 transition-all duration-500 flex-shrink-0"
        >
            <Image
                src={item.src}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            {/* Card Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-70 group-hover:opacity-90 transition-opacity" />

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
