"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";

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

export function MassProductionMetal() {
    const t = useTranslations("public.massProduction");
    const tm = useTranslations("public.massProduction.metal");
    const items = tm.raw("items") as { title: string; text: string }[];
    const designItems = tm.raw("designItems") as string[];
    const moldItems = tm.raw("moldItems") as string[];

    return (
        <>
            {/* ================= 1. BLOCK ================= */}
            <section id="metal" className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

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
                            {t("tabs.metal")}
                        </h4>

                        <p className="text-muted-foreground leading-relaxed">
                            {tm("intro")}
                        </p>
                    </motion.div>

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative h-[320px] rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/metal.png"
                            alt={tm("imageAlt")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 2. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/metal2.png"
                            alt={tm("imageAlt")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        {items.map((item) => (
                            <div key={item.title} className="space-y-2 group hover:translate-x-1 transition">
                                <div className="flex items-center gap-3">
                                    <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                    <h4 className="font-semibold text-[var(--color-brand)]">
                                        {item.title}
                                    </h4>
                                </div>
                                <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                    {item.text}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ================= 3. BLOCK (Centered Summary) ================= */}
            <section className="py-24 bg-neutral-900 text-white overflow-hidden relative">
                {/* Subtle Background Pattern or Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand)]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-brand)]/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h4 className="text-xl md:text-2xl font-semibold text-[var(--color-brand)]">
                            {tm("summaryTitle")}
                        </h4>
                        <p className="text-lg md:text-xl text-neutral-300 leading-relaxed font-light italic">
                            {tm("summaryQuote")}
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="w-20 h-1 bg-[var(--color-brand)] mx-auto rounded-full"
                    />

                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="text-neutral-400 leading-relaxed max-w-2xl mx-auto"
                    >
                        {tm("summaryBody")}
                    </motion.p>
                </div>
            </section>


            {/* ================= 4. BLOCK ================= */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">
                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        {designItems.map((text, i) => (
                            <div key={i} className="flex gap-3 items-start group hover:translate-x-1 transition">
                                <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {text}
                                </p>
                            </div>
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
                            src="/logos/fire.png"
                            alt={tm("imageAlt")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 5. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">
                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/profile.jpeg"
                            alt={tm("imageAlt")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        {moldItems.map((text, i) => (
                            <div key={i} className="flex gap-3 items-start group hover:translate-x-1 transition">
                                <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                                <p className="text-muted-foreground leading-relaxed text-sm">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ================= 6. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="text-xl md:text-lg font-medium text-[var(--color-brand)] leading-relaxed"
                    >
                        {tm("closing")}
                    </motion.p>
                </div>
            </section>
        </>
    );
}
