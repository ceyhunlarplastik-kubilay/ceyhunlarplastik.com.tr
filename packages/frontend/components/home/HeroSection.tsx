"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { ClientsMarquee } from "./ClientsMarquee";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";

const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HeroSection() {
    const t = useTranslations("home.hero");
    const words = t.raw("words") as string[];
    const reduce = useReducedMotion();
    const [index, setIndex] = useState(0);

    // Rotating brand word. Auto-rotation is motion; disable it under reduced motion.
    useEffect(() => {
        if (reduce) return;
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % words.length);
        }, 2800);
        return () => clearInterval(id);
    }, [words.length, reduce]);

    // Staggered above-the-fold entrance (skipped under reduced motion).
    const enter = (delay: number) => ({
        initial: reduce ? false : { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.7, ease: EASE, delay },
    });

    return (
        <section
            className="
                relative w-full overflow-hidden bg-background
                flex flex-col
                lg:h-[calc(100dvh-var(--navbar-height,80px))]
                lg:min-h-140 lg:max-h-225
            "
        >
            {/* Ambient brand warmth behind the asset. Very low opacity, single accent, not a neon glow. */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-1/4 inset-e-0 h-[70%] w-1/2 rounded-full opacity-[0.07] blur-3xl"
                style={{
                    background:
                        "radial-gradient(circle, var(--color-brand), transparent 70%)",
                }}
            />

            {/* Hero moment: fills the space above the standards strip. */}
            <div className="flex-1 min-h-0 flex items-center">
                <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-10 xl:px-12 py-10 lg:py-0">
                    <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 xl:gap-20">
                        {/* Left: copy */}
                        <div>
                            <motion.h1
                                {...enter(0)}
                                className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl"
                            >
                                {/* Rotating brand word on its own line: width can vary without shifting anything below. */}
                                <span className="relative block overflow-hidden leading-[1.2] text-brand">
                                    <span className="invisible" aria-hidden="true">
                                        {words[index]}
                                    </span>
                                    {reduce ? (
                                        <span className="absolute inset-0 flex items-center">
                                            {words[index]}
                                        </span>
                                    ) : (
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={words[index]}
                                                initial={{ y: "110%" }}
                                                animate={{ y: 0 }}
                                                exit={{ y: "-110%" }}
                                                transition={{ duration: 0.5, ease: EASE }}
                                                className="absolute inset-0 flex items-center"
                                            >
                                                {words[index]}
                                            </motion.span>
                                        </AnimatePresence>
                                    )}
                                </span>

                                <span className="block text-foreground">
                                    {t("titleSuffix")}
                                </span>
                            </motion.h1>

                            <motion.p
                                {...enter(0.15)}
                                className="mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
                            >
                                {t("subtitle")}
                            </motion.p>

                            <motion.div
                                {...enter(0.3)}
                                className="mt-10 flex flex-wrap items-center gap-4"
                            >
                                <Button
                                    asChild
                                    variant="brand"
                                    size="lg"
                                    className="group"
                                >
                                    <Link href="/urunler">
                                        {t("ctaProducts")}
                                        {/* Ok hem aynalanır hem hover itişi ters yöne alınır:
                                            translate, scale'den önce uygulandığı için tek başına
                                            aynalamak itişi düzeltmiyor. */}
                                        <ArrowRight className="ms-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 rtl:-scale-x-100" />
                                    </Link>
                                </Button>

                                <Button asChild variant="outline" size="lg">
                                    <Link href="/iletisim">{t("ctaQuote")}</Link>
                                </Button>
                            </motion.div>
                        </div>

                        {/* Right: brand asset */}
                        <motion.div
                            initial={reduce ? false : { opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}
                            className="relative"
                        >
                            <div
                                className="
                                    relative w-full overflow-hidden rounded-2xl
                                    ring-1 ring-black/5
                                    shadow-[0_30px_60px_-20px_rgba(204,179,110,0.35)]
                                    aspect-4/5
                                    lg:aspect-auto lg:h-[min(62vh,540px)] xl:h-[min(66vh,600px)]
                                "
                            >
                                <div className="absolute inset-0 z-10 bg-linear-to-t from-black/25 via-transparent to-transparent" />
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

            {/* Standards / capabilities strip: a separate band below the hero moment, not part of the hero copy stack. */}
            <div className="shrink-0 border-t bg-background/80 backdrop-blur-sm">
                <div className="mx-auto max-w-8xl px-2 py-4 sm:px-4 lg:py-5">
                    <ClientsMarquee />
                </div>
            </div>
        </section>
    );
}
