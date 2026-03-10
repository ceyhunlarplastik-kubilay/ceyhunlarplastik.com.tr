"use client";

import { motion, type Variants } from "motion/react";

/* ------------------------------------------------------------------ */
/* Motion config (v12+ uyumlu) */
/* ------------------------------------------------------------------ */

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
    hidden: {},
    show: {
        transition: {
            staggerChildren: 0.14,
        },
    },
};

const fadeUp: Variants = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.65,
            ease: EASE_OUT,
        },
    },
};

/* ------------------------------------------------------------------ */
/* Component */
/* ------------------------------------------------------------------ */

export function Enviroment() {
    return (
        <section className="relative isolate overflow-hidden">
            {/* Background image */}
            <div
                className="absolute inset-0 -z-10 bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url(/logos/nature.jpg)",
                    backgroundSize: "110%", // zoom-out
                }}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 -z-10 bg-black/55" />

            {/* Content */}
            <div className="mx-auto max-w-6xl px-6 min-h-[520px] lg:min-h-[600px] flex items-center justify-center text-center">
                <motion.div
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-120px" }}
                    className="relative max-w-3xl"
                >
                    {/* Corner decorations */}
                    <span className="absolute -top-6 -left-6 h-8 w-8 border-l-2 border-t-2 border-white/70" />
                    <span className="absolute -bottom-6 -right-6 h-8 w-8 border-r-2 border-b-2 border-white/70" />

                    {/* Title */}
                    <motion.h2
                        variants={fadeUp}
                        className="text-4xl md:text-5xl font-bold tracking-wide text-white"
                    >
                        DOĞA DOSTU
                    </motion.h2>

                    <motion.h3
                        variants={fadeUp}
                        className="mt-2 text-3xl md:text-4xl font-light tracking-[0.35em] text-white"
                    >
                        ÜRETİM
                    </motion.h3>

                    {/* Subtitle */}
                    <motion.p
                        variants={fadeUp}
                        className="mt-6 text-base md:text-lg font-medium text-white/85"
                    >
                        Firmamız üretimlerinin{" "}
                        <span className="text-[var(--color-brand)] font-semibold">
                            %80&apos;den fazlasını
                        </span>{" "}
                        yenilenebilir enerji ile sağlamaktadır.
                    </motion.p>

                    {/* Paragraph */}
                    <motion.p
                        variants={fadeUp}
                        className="mt-4 text-sm md:text-base leading-relaxed text-white/75"
                    >
                        Çevremize, toplumumuza ve geleceğimize olan duyarlılığımızın ve
                        sorumluluğumuzun ışığında doğa dostu üretim modeli kullanıyor;
                        sürdürülebilir bir dünya ve iyi bir gelecek için çalışıyoruz.
                    </motion.p>
                </motion.div>
            </div>
        </section>
    );
}
