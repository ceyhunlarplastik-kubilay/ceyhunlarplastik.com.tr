"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { InfoCard } from "@/components/ui/info-card";
import { StatsBar } from "@/components/icons/StatsBar";

export function AboutSection() {
    const t = useTranslations("home.about");

    return (
        <section className="relative bg-muted/30 pt-12 overflow-hidden">
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
                        <h2 className="text-xl md:text-2xl font-bold text-brand mb-2">
                            {t("brand")}
                        </h2>

                        <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-2">
                            {t("subtitle")}
                        </h3>

                        <h4 className="text-l md:text-l font-semibold text-muted-foreground mb-2">
                            {t("lead")}
                        </h4>

                        <p className="text-lg md:text-l text-muted-foreground leading-relaxed mb-2">
                            {t("body1")}
                        </p>

                        <p className="text-lg md:text-l text-muted-foreground leading-relaxed mb-6">
                            {t("body2")}
                        </p>

                        <p className="text-lg md:text-l text-muted-foreground leading-relaxed mb-8">
                            {t("body3")}
                        </p>
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
