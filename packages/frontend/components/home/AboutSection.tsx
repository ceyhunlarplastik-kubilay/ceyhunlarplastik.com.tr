"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { InfoCard } from "@/components/ui/info-card";
import { StatsBar } from "@/components/icons/StatsBar";

export function AboutSection() {
    const t = useTranslations("home.about");

    return (
        <section className="relative bg-muted/30 pt-16 pb-12 overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                <div className="flex flex-col lg:flex-row items-stretch justify-between gap-12 lg:gap-20">
                    {/* LEFT – TEXT */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        viewport={{ once: true }}
                        className="flex flex-col justify-center lg:w-[45%]"
                    >
                        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                            {t("brand")}
                        </p>

                        <h2 className="mt-3 text-balance text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                            {t("subtitle")}
                        </h2>

                        <p className="mt-4 text-lg font-medium text-foreground/80">
                            {t("lead")}
                        </p>

                        <div className="mt-4 space-y-4 text-pretty text-base md:text-lg text-muted-foreground leading-relaxed">
                            <p>{t("body1")}</p>
                            <p>{t("body2")}</p>
                            <p>{t("body3")}</p>
                        </div>
                    </motion.div>

                    {/* RIGHT – INFO CARD */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                        viewport={{ once: true }}
                        className="h-full lg:w-[45%]"
                    >
                        <InfoCard
                            image="/logos/ekibimiz-banner.jpg"
                            title={t("infoTitle")}
                            description={t("infoDescription")}
                            ctaPrimary={t("infoCtaPrimary")}
                            ctaSecondary={t("infoCtaSecondary")}
                            ctaPrimaryHref="/hakkimizda"
                            ctaSecondaryHref="/iletisim"
                            className="h-full shadow-2xl"
                        />
                    </motion.div>
                </div>
                <div className="mt-16">
                    <StatsBar />
                </div>
            </div>
        </section>
    );
}
