"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { Users, ShieldCheck, TrendingUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";

// Metinler katalogdan gelir; burada yalnız ikon + key eşlemesi.
const cards = [
    { icon: Users, key: "team" },
    { icon: ShieldCheck, key: "safe" },
    { icon: TrendingUp, key: "career" },
] as const;

export default function HrHero() {
    const t = useTranslations("public.hr.hero");

    const scrollToForm = () => {
        document.getElementById("hr-form")?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section className="relative min-h-[90vh] flex items-center">
            {/* Background */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/logos/hr.jpg"
                    alt={t("imageAlt")}
                    fill
                    priority
                    className="object-cover"
                />
                <div className="absolute inset-0 bg-[color-mix(in_oklab,var(--color-brand)_30%,black)]/75" />
            </div>

            <div className="mx-auto max-w-6xl px-6 text-center text-white">
                {/* HERO TEXT */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-5xl font-bold"
                >
                    {t("title")}
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="mt-6 text-lg text-white/90"
                >
                    {t("subtitle")}
                </motion.p>

                {/* CTA BUTTON */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-10 flex justify-center"
                >
                    <Button
                        size="lg"
                        onClick={scrollToForm}
                        className="
              gap-2
              bg-white text-black
              hover:bg-[var(--color-brand)]
              hover:text-white
            "
                    >
                        {t("cta")}
                        <ArrowDown className="h-4 w-4" />
                    </Button>
                </motion.div>

                {/* WHY US CARDS */}
                <motion.div
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                    variants={{
                        hidden: {},
                        visible: { transition: { staggerChildren: 0.12 } },
                    }}
                    className="mt-16 grid gap-6 md:grid-cols-3"
                >
                    {cards.map((item) => (
                        <motion.div
                            key={item.key}
                            variants={{
                                hidden: { opacity: 0, y: 20 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            whileHover={{
                                y: -6,
                                boxShadow: "0 20px 40px -20px rgba(204,179,110,0.45)",
                            }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="
                group
                rounded-2xl
                border border-white/20
                bg-white/5
                backdrop-blur-sm
                p-6
                text-left
                transition-colors
                hover:border-[var(--color-brand)]
              "
                        >
                            <item.icon
                                className="
                  h-8 w-8
                  text-[var(--color-brand)]
                  transition-transform
                  group-hover:scale-110
                "
                            />

                            <h3 className="mt-4 text-lg font-semibold text-white">
                                {t(`cards.${item.key}.title`)}
                            </h3>

                            <p className="mt-2 text-sm text-white/80">
                                {t(`cards.${item.key}.text`)}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
