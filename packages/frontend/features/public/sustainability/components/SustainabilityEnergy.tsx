"use client";

import Image from "next/image";
import { motion } from "motion/react";

export function SustainabilityEnergy() {
    return (
        <section className="py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                {/* ================= LEFT BIG IMAGE ================= */}
                <motion.div
                    initial={{ opacity: 0, x: -60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className="relative w-full h-[420px] md:h-[500px] rounded-3xl overflow-hidden"
                >
                    <Image
                        src="/logos/st3.jpg"
                        alt="Güneş enerjisi üretim"
                        fill
                        className="object-cover"
                    />
                </motion.div>

                {/* ================= RIGHT CONTENT ================= */}
                <motion.div
                    initial={{ opacity: 0, x: 60 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
                    className="space-y-6"
                >
                    {/* TITLE */}
                    <h3 className="text-2xl md:text-3xl font-semibold text-neutral-900 leading-snug">
                        Enerjimiz{" "}
                        <span className="text-[var(--color-brand)]">
                            Güneşten!
                        </span>
                    </h3>

                    {/* PARAGRAPH */}
                    <p className="text-muted-foreground leading-relaxed">
                        Şirketimiz, sürdürülebilir enerji çözümleriyle geleceğin enerji
                        ihtiyaçlarına yönelik önemli bir adım atmaktadır. Güneş enerjisi,
                        doğanın bize sunduğu temiz, yenilenebilir ve sınırsız bir kaynaktır.
                        Biz de bu değerli kaynağı kullanarak enerji ihtiyacımızı
                        karşılıyoruz.
                    </p>

                    {/* SMALL IMAGES */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="relative h-[120px] rounded-xl overflow-hidden"
                        >
                            <Image
                                src="/logos/st4.jpg"
                                alt="Güneş paneli detay"
                                fill
                                className="object-cover"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="relative h-[120px] rounded-xl overflow-hidden"
                        >
                            <Image
                                src="/logos/st5.jpg"
                                alt="Enerji üretimi"
                                fill
                                className="object-cover"
                            />
                        </motion.div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}