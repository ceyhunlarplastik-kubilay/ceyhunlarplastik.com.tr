"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function AboutDetails() {
    const t = useTranslations("public.about.details");

    return (
        <div>

            {/* ================= DEVELOPMENT ================= */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">

                    {/* IMAGE */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative w-full max-w-4xl mx-auto h-[300px] md:h-[380px] rounded-3xl overflow-hidden mb-12"
                    >
                        <Image
                            src="/logos/hakkimizda2.jpg"
                            alt={t("developmentImageAlt")}
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="max-w-5xl mx-auto space-y-6 leading-relaxed text-muted-foreground"
                    >

                        <p className="text-lg md:text-xl text-neutral-900 font-medium">
                            {t("devIntro")}
                        </p>

                        <p>
                            {t("devInitiatives")}
                        </p>

                        <p>
                            {t("devRnd3d")}
                        </p>

                        <p>
                            {t("devEndToEnd")}
                        </p>

                        <p className="font-medium text-neutral-900">
                            {t("devClosing")}
                        </p>
                    </motion.div>

                </div>
            </section>


            {/* ================= MOTTO ================= */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* BACKGROUND QUOTE */}
                    <div className="absolute right-10 top-10 text-[200px] text-neutral-200/40 blur-[2px] font-serif select-none pointer-events-none hidden lg:block">
                        “”
                    </div>

                    {/* IMAGE (VERTICAL FULL) */}
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative h-[420px] md:h-[520px] w-full rounded-3xl overflow-hidden"
                    >
                        <Image
                            src="/motto.png"
                            alt={t("mottoImageAlt")}
                            fill
                            className="object-contain transition-transform duration-700 hover:scale-105"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="space-y-6 relative z-10"
                    >

                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            {t.rich("mottoTitle", {
                                highlight: (chunks) => (
                                    <span className="text-[--color-brand]">{chunks}</span>
                                ),
                            })}
                        </h2>

                        <p className="text-muted-foreground italic text-lg">
                            {t("mottoQuote")}
                        </p>

                        <p className="text-lg text-neutral-800 leading-relaxed">
                            {t("mottoBody1")}
                        </p>

                        <p className="text-muted-foreground leading-relaxed">
                            {t("mottoBody2")}
                        </p>

                    </motion.div>

                </div>
            </section>

        </div>
    );
}
