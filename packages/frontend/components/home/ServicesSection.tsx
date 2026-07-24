"use client"

import ColorChangeCards from "@/components/ui/color-change-card";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function ServicesSection() {
    const t = useTranslations("home.services");

    return (
        <section className="relative bg-(--color-section-bg) pt-20 pb-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-10">
                {/* HEADER — full-width above the bento grid */}
                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    viewport={{ once: true }}
                    className="max-w-2xl mb-12"
                >
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
                        {t("brand")}
                    </p>
                    <h2 className="mt-3 text-balance text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
                        {t("subtitle")}
                    </h2>
                </motion.div>

                {/* BENTO GRID — keeps its own full-width layout */}
                <ColorChangeCards />
            </div>
        </section>
    );
}
