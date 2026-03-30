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

export function Enviroment({ fullScreen = false }: { fullScreen?: boolean }) {
    return (
        <section
            className={`
                relative isolate overflow-hidden
                ${fullScreen ? "min-h-[calc(100vh-var(--navbar-height))]" : ""}
            `}
        >
            {/* Background image */}
            <div
                className="absolute inset-0 -z-10 bg-center bg-no-repeat"
                style={{
                    backgroundImage: "url(/logos/nature.jpg)",
                    // backgroundSize: "110%", // zoom-out
                    backgroundSize: "cover", // zoom-out
                }}
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 -z-10 bg-black/45" />

            {/* Content */}
            <div
                className={`
                    mx-auto max-w-6xl px-6
                    ${fullScreen ? "h-[calc(100vh-var(--navbar-height))]" : "min-h-[520px] lg:min-h-[600px]"}
                    flex items-center justify-center text-center
                `}
            >
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

                    <div className="w-full max-w-2xl mx-auto">

                        {/* DOĞA */}
                        <motion.div
                            variants={fadeUp}
                            className="w-full text-left pl-2 md:pl-6"
                        >
                            <h2 className="
      font-heading
      text-5xl md:text-6xl lg:text-7xl
      font-light
      text-white
    ">
                                DOĞA
                            </h2>
                        </motion.div>

                        {/* DOSTU */}
                        <motion.div
                            variants={fadeUp}
                            className="w-full text-center -mt-2"
                        >
                            <h2 className="
      font-heading
      text-6xl md:text-7xl lg:text-[110px]
      font-extrabold
      text-white
      leading-none
      [text-shadow:0_10px_40px_rgba(0,0,0,0.5)]
    ">
                                DOSTU
                            </h2>
                        </motion.div>

                        {/* ÜRETİM */}
                        <motion.div
                            variants={fadeUp}
                            className="w-full text-right pr-2 md:pr-6"
                        >
                            <h2 className="
      font-heading
      text-4xl md:text-5xl lg:text-6xl
      font-light
      tracking-[0.25em]
      text-white/90
    ">
                                ÜRETİM
                            </h2>
                        </motion.div>

                    </div>

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
