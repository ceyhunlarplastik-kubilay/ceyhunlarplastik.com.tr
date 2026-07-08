"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function SustainabilityIntro() {
    const t = useTranslations("public.sustainability.intro");

    return (
        <section className="bg-white py-20 overflow-hidden">
            <div className="space-y-20">

                {/* ================= HEADER (Centered) ================= */}
                <div className="max-w-7xl mx-auto px-6">
                    <div className="max-w-6xl space-y-6">
                        <h2 className="text-3xl md:text-4xl font-semibold text-neutral-900">
                            {t("heroTitle")}
                        </h2>

                        <p className="text-muted-foreground">
                            {t("heroBody")}
                        </p>
                    </div>
                </div>

                {/* ================= IMAGE + TEXT (Bleed to Left) ================= */}
                <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">

                    {/* IMAGE (Sola tam yaslı) */}
                    <div className="w-full lg:w-1/2 h-[350px] md:h-[450px] lg:h-[550px] relative">
                        <Image
                            src="/logos/cloud.jpg"
                            alt={t("imageAlt")}
                            fill
                            priority
                            className="object-cover"
                        />
                    </div>

                    {/* TEXT (İçerikle hizalı) */}
                    <div className="px-6 lg:px-0 lg:flex-1 lg:max-w-xl">
                        <div className="space-y-6">
                            <motion.h3
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                                className="text-2xl md:text-3xl lg:text-4xl font-semibold text-neutral-900 leading-snug"
                            >
                                {t.rich("protectTitle", {
                                    highlight: (chunks) => (
                                        <motion.span
                                            initial={{ opacity: 0, y: 20 }}
                                            whileInView={{ opacity: 1, y: 0 }}
                                            viewport={{ once: true }}
                                            transition={{
                                                delay: 0.25,
                                                duration: 0.6,
                                                ease: [0.16, 1, 0.3, 1],
                                            }}
                                            className="text-[var(--color-brand)] block sm:inline"
                                        >
                                            {chunks}
                                        </motion.span>
                                    ),
                                })}
                            </motion.h3>

                            <motion.p
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: 0.35, duration: 0.6 }}
                                className="text-lg text-muted-foreground"
                            >
                                {t("protectBody")}
                            </motion.p>
                        </div>
                    </div>
                </div>

                {/* ================= CERTIFICATES (Centered) ================= */}
                <div className="max-w-7xl mx-auto px-6">

                    {/* ================= CERTIFICATES (Centered & Responsive) ================= */}
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center border-t border-neutral-100 pt-16">
                            {/* 1 */}
                            {/* </div><div className="relative h-[120px] flex items-center justify-center grayscale hover:grayscale-0 opacity-60 hover:opacity-100 transition duration-500"> */}
                            <div className="relative h-[120px] flex items-center justify-center transition duration-500">
                                <Image
                                    src="/logos/sust-cert-1-150x150.png"
                                    alt={t("certAlt", { number: 1 })}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                />
                            </div>

                            {/* 2 */}
                            <div className="relative h-[120px] flex items-center justify-center transition duration-500">
                                <Image
                                    src="/logos/sust-cert-2-150x150.png"
                                    alt={t("certAlt", { number: 2 })}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                />
                            </div>

                            {/* 3 */}
                            <div className="relative h-[120px] flex items-center justify-center transition duration-500">
                                <Image
                                    src="/logos/sust-cert-3-150x150.png"
                                    alt={t("certAlt", { number: 3 })}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                />
                            </div>

                            {/* 4 */}
                            <div className="relative h-[120px] flex items-center justify-center transition duration-500">
                                <Image
                                    src="/logos/sust-cert-4-150x150.png"
                                    alt={t("certAlt", { number: 4 })}
                                    width={120}
                                    height={120}
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>

                </div>

            </div>
        </section>
    );
}