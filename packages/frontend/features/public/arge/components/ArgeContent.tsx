"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";

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

export function ArgeContent() {
    const t = useTranslations("public.arge");
    const tb = useTranslations("shared.breadcrumbs");
    const block2Items = t.raw("block2Items") as string[];
    const block3Items = t.raw("block3Items") as string[];

    return (
        <main className="bg-white">

            {/* HERO */}
            <PageHero
                title={t("heroTitle")}
                breadcrumbs={[
                    { label: tb("home"), href: "/" },
                    { label: tb("services") },
                ]}
            />
            {/* ================= 1. BLOCK ================= */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-5"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            {t("block1Title")}
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                            {t("block1Body")}
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
                            src="/logos/arge-1.webp"
                            alt={t("imageAlt1")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 2. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative h-[320px] rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/arge-2.webp"
                            alt={t("imageAlt2")}
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
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            {t("block2Title")}
                        </h2>

                        {block2Items.map((text, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                                <p className="text-muted-foreground leading-relaxed">
                                    {text}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ================= 3. BLOCK ================= */}
            <section className="py-20">
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
                            {t("block3Title")}
                        </h2>

                        {block3Items.map((text, i) => (
                            <div key={i} className="flex gap-3 items-start">
                                <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                                <p className="text-muted-foreground leading-relaxed">
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
                        className="relative h-[320px] rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/arge-3.png"
                            alt={t("imageAlt3")}
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 4. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="text-xl md:text-lg font-medium text-[var(--color-brand)] leading-relaxed"
                    >
                        {t("closing")}
                    </motion.p>
                </div>
            </section>

        </main>
    );
}
