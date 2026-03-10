"use client";

import { motion } from "motion/react";
import { InfoCard } from "@/components/ui/info-card";
import { StatsBar } from "@/components/icons/StatsBar";

export function AboutSection() {
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
                            Ceyhunlar
                        </h2>

                        <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-2">
                            Projeden Seri Üretime
                        </h3>

                        <h4 className="text-l md:text-l font-semibold text-muted-foreground mb-2">
                            Ceyhunlar Plastik Sanayi ve Ticaret Ltd. Şti. olarak, projenizin
                            her adımında yanınızdayız.
                        </h4>

                        <p className="text-lg md:text-l text-muted-foreground leading-relaxed mb-2">
                            Plastik, kauçuk, metal ve bakalit ürün projelerinizde; taslaktan
                            başlayan, Ar-Ge ile gelişen ve seri üretim ile sonuçlanan
                            fayda/maliyet odaklı iş modelimizle size özel çözümler üretiyoruz.
                        </p>

                        <p className="text-lg md:text-l text-muted-foreground leading-relaxed mb-6">
                            Projelerinizin nihai ürüne ulaşması için: 3D modelleme, Model
                            analizi, Numune ve prototip üretimi, Üretim analizi, Kalıplama ve
                            Seri üretim baskı hizmetlerini tek çatı altında sunuyoruz.
                        </p>

                        <p className="text-lg md:text-l text-muted-foreground leading-relaxed mb-8">
                            Yeni ürün geliştirme talepleriniz için Ar-Ge hizmetlerimizden
                            yararlanabilir, özel ürün siparişleriniz için fiyat teklifi
                            alabilir, 35.000’den fazla ürünümüzü sergilediğimiz
                            kataloglarımızı inceleyebilir ve bayimiz olmak için bizimle
                            iletişime geçebilirsiniz.
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
                            title="200+ Uzman Çalışan Gücümüzle"
                            description="Ekibimizin bilgi birikimi ve yetkinliği, sunduğumuz çözümlerin kalitesini ve güvenilirliğini garanti eder."
                            ctaPrimary="Hakkımızda"
                            ctaSecondary="İletişim"
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
