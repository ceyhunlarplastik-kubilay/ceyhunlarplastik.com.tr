"use client";

import Image from "next/image";
import { motion } from "motion/react";

export default function AboutContent() {
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
                        Ceyhunlar Plastik
                    </span>

                    <h2 className="mt-2 text-3xl md:text-4xl font-bold text-neutral-900">
                        Hakkımızda
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
                        Ceyhunlar Plastik Sanayii olarak temellerimizi İzmir’de attık ve
                        bugün dünya çapında hizmet veren güçlü bir üretici konumuna ulaştık.
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        850’den fazla bayimiz ve 12.000’i aşkın müşterimiz ile Türkiye başta
                        olmak üzere 40’tan fazla ülkede faaliyet gösteriyoruz. Ürünlerimiz;
                        mobilya, otomotiv, medikal, savunma sanayi, inşaat ve daha birçok
                        sektörde kullanılmaktadır.
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        Gelişmiş üretim teknolojilerimiz ve sürekli genişleyen ürün gamımız
                        sayesinde müşterilerimizin ihtiyaçlarına hızlı, kaliteli ve güvenilir
                        çözümler sunuyoruz.
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                    >
                        Ar-Ge yatırımlarımız, çevreye duyarlı üretim anlayışımız ve yüksek
                        kalite standartlarımız ile sektörde fark yaratmaya devam ediyoruz.
                    </motion.p>

                    <motion.p
                        variants={{
                            hidden: { opacity: 0, y: 20 },
                            visible: { opacity: 1, y: 0 },
                        }}
                        className="font-medium text-neutral-900"
                    >
                        Amacımız; müşteri memnuniyetini en üst seviyede tutarak,
                        sürdürülebilir ve yenilikçi çözümler üretmektir.
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
                        alt="Ceyhunlar Plastik Üretim"
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
