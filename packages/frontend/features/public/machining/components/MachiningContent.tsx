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

export function MachiningContent() {
    const t = useTranslations("public.machining");
    const tb = useTranslations("shared.breadcrumbs");
    const items = t.raw("items") as { title: string; text: string }[];

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
                        className="space-y-4"
                    >
                        <h4 className="text-xl font-semibold text-[var(--color-brand)]">
                            {t("serviceLabel")}
                        </h4>
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 -mt-4">
                            {t("introTitle")}
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                            {t("introBody")}
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
                            src="/logos/machining-1.png"
                            alt={t("imageAlt")}
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
                            src="/logos/machining-2.jpg"
                            alt={t("imageAlt")}
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
        </main>
    );
}
