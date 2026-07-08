"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export default function AboutContent() {
    const t = useTranslations("public.about.content");
    const tCommon = useTranslations("common");

    return (
        <section className="py-20 bg-white">
            <div className="mx-auto max-w-7xl px-6">

                {/* HEADER */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                >
                    <span className="text-sm font-semibold tracking-wider text-[var(--color-brand)] uppercase">
                        {tCommon("siteName")}
                    </span>

                    <h2 className="mt-2 text-3xl md:text-4xl font-bold text-neutral-900">
                        {t("title")}
                    </h2>
                </motion.div>

                {/* CONTENT */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.15 } },
                    }}
                    className="mt-8 space-y-6 text-neutral-700"
                >
                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        className="text-lg font-medium text-neutral-900"
                    >
                        {t("intro")}
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {t("reach")}
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {t("capabilities")}
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        {t("rnd")}
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        className="font-medium text-neutral-900"
                    >
                        {t("mission")}
                    </motion.p>
                </motion.div>

                {/* IMAGE (ALTA) */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="mt-12 relative h-[320px] md:h-[420px] rounded-3xl overflow-hidden shadow-xl"
                >
                    <Image
                        src="/logos/hakkimizda.jpg"
                        alt={t("productionImageAlt")}
                        fill
                        className="object-cover"
                    />

                    {/* subtle overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
            </div>
        </section>
    );
}
