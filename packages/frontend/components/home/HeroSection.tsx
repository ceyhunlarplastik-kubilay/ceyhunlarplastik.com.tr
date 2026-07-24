"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ClientsMarquee } from "./ClientsMarquee";
import { motion, AnimatePresence } from "motion/react";
import { useEffect, useState } from "react";

export function HeroSection() {
    const t = useTranslations("home.hero");
    const words = t.raw("words") as string[];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % words.length);
        }, 2500);
        return () => clearInterval(id);
    }, [words.length]);

    return (
        <section
            className="
                relative w-full bg-white overflow-hidden
                lg:h-[calc(100dvh-var(--navbar-height,80px))]
                lg:min-h-140
                lg:max-h-225
                flex flex-col
            "
        >
            {/* HERO CONTENT — takes remaining space */}
            <div className="flex-1 min-h-0 flex items-center">
                <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-10 lg:py-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
                        {/* LEFT — Text */}
                        <div>
                            <h1 className="text-balance text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1]">
                                <span className="inline-flex items-baseline gap-3">
                                    {/* Animated word container */}
                                    <span className="relative inline-block w-[22ch] overflow-hidden text-brand align-bottom">
                                        <span className="invisible" aria-hidden="true">
                                            {words[index]}
                                        </span>
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={words[index]}
                                                initial={{ y: "100%" }}
                                                animate={{ y: 0 }}
                                                exit={{ y: "-100%" }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                className="absolute inset-0 flex items-center"
                                            >
                                                {words[index]}
                                            </motion.span>
                                        </AnimatePresence>
                                    </span>
                                </span>
                                <br />
                                {t("titleSuffix")}
                            </h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-6 max-w-xl text-pretty text-base sm:text-lg leading-relaxed text-muted-foreground"
                            >
                                {t("subtitle")}
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mt-10 flex flex-wrap gap-4"
                            >
                                <Button asChild variant="brand" size="lg">
                                    {/* <Link href="/urunler/filtre"> */}
                                    <Link href="/urunler">
                                        {t("ctaProducts")}
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="lg">
                                    <Link href="/iletisim">
                                        {t("ctaQuote")}
                                    </Link>
                                </Button>
                            </motion.div>
                        </div>

                        {/* RIGHT — Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative"
                        >
                            <div
                                className="
                                    relative w-full overflow-hidden rounded-2xl shadow-xl
                                    aspect-4/5
                                    lg:aspect-auto
                                    lg:h-[min(60vh,520px)]
                                    xl:h-[min(64vh,580px)]
                                "
                            >
                                {/* Depth overlays — consistent single light source (top) */}
                                <div className="absolute inset-0 z-10 bg-linear-to-tr from-black/25 via-transparent to-transparent" />
                                <div className="absolute inset-0 z-10 bg-linear-to-t from-black/20 to-transparent" />

                                <Image
                                    src="/logos/ceyhunlar-hero.jpg"
                                    alt={t("imageAlt")}
                                    fill
                                    priority
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* MARQUEE — fixed height at bottom */}
            <div className="border-t bg-white shrink-0">
                <div className="mx-auto max-w-8xl px-2 sm:px-4 py-4 lg:py-5">
                    <ClientsMarquee />
                </div>
            </div>
        </section>
    );
}
