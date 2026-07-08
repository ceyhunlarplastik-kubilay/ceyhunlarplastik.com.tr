"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: EASE_OUT,
        },
    },
};

export function MassProductionBakalite() {
    const t = useTranslations("public.massProduction");
    const tbk = useTranslations("public.massProduction.bakelite");
    const paragraphs = tbk.raw("paragraphs") as string[];

    return (
        <>
            <section id="bakelite" className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            {t("sectionLabel")}
                        </h2>
                        <h4 className="text-xl font-semibold text-[var(--color-brand)] -mt-4">
                            {t("tabs.bakelite")}
                        </h4>

                        {paragraphs.map((text, i) => (
                            <p key={i} className="text-muted-foreground leading-relaxed">
                                {text}
                            </p>
                        ))}
                    </motion.div>

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/bakalite.png"
                            alt={tbk("imageAlt")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>
        </>
    );
}
