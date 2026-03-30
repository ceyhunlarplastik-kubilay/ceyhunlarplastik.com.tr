"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Check } from "lucide-react";
import { PageHero } from "@/components/sections/PageHero";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
    hidden: { opacity: 0, y: 30 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            duration: 0.6,
            ease: EASE_OUT,
        },
    },
};

export function ArgeContent() {
    return (
        <main className="bg-white">

            {/* HERO */}
            <PageHero
                title="Ar-Ge ve Prototipleme"
                breadcrumbs={[
                    { label: "Ana Sayfa", href: "/" },
                    { label: "Hizmetler" },
                ]}
            />
            {/* ================= 1. BLOCK ================= */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-5"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            ARGE ve Prototip Geliştirme Süreçleri
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                            ARGE (Araştırma ve Geliştirme) ve prototip geliştirme, bir organizasyonun veya şirketin yenilik ve ilerleme sürecinde kritik bir rol oynar. Bu süreçler, yeni ürünlerin, hizmetlerin veya iş süreçlerinin yaratılması, iyileştirilmesi ve test edilmesi için kullanılır.
                        </p>
                    </motion.div>

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative h-[320px] rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/arge-1.webp"
                            alt="Ar-Ge"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 2. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative h-[320px] rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/arge-2.webp"
                            alt="Prototipleme"
                            fill
                            className="object-cover"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            ARGE (Araştırma ve Geliştirme)
                        </h2>

                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Yenilik ve İlerleme: ARGE, yeni fikirlerin ve teknolojilerin keşfi ve geliştirilmesi anlamına gelir. Bu, şirketin rekabet avantajını sürdürebilmesi için kritiktir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Ürün ve Süreç Geliştirme: ARGE faaliyetleri, mevcut ürünleri veya iş süreçlerini iyileştirmek ve daha etkin hale getirmek için gerçekleştirilebilir. Bu, ürünlerin kalitesini artırabilir ve üretim süreçlerini optimize edebilir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Pazar Analizi: ARGE, pazar eğilimlerini ve müşteri ihtiyaçlarını anlamak için kullanılabilir. Bu, gelecekteki taleplere uygun ürün ve hizmetlerin geliştirilmesine yardımcı olabilir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Teknolojik Rekabet: ARGE faaliyetleri, teknolojik bir rekabet avantajı sağlamak için kullanılabilir. Yenilikçi teknolojiler ve çözümler, şirketin sektöründeki liderliğini sürdürebilmesine yardımcı olabilir.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ================= 3. BLOCK ================= */}
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            Üretim Öncesi Planlama
                        </h2>

                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Fiziksel Ürün veya Süreç Modelleme: Prototip geliştirme, bir fikrin veya konseptin fiziksel bir modelini oluşturmayı içerir. Bu, tasarım hatalarını belirlemek ve iyileştirmeler yapmak için önemlidir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Test ve Geri Bildirim: Prototipler, gerçek dünya koşullarında test edilebilir. Bu, ürünün veya sürecin performansını değerlendirmek ve müşteri geri bildirimini toplamak için kullanılır.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                Maliyet ve Zaman Tasarrufu: Prototip geliştirme aşaması, son ürün veya süreçte maliyetli hataların önlenmesine ve zaman tasarrufu sağlamaya yardımcı olabilir. İleri aşamalarda düzeltilmesi zor olan hataların erken tespiti mümkündür.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start">
                            <Check className="text-green-500 mt-1 w-6 h-6 shrink-0" />
                            <p className="text-muted-foreground leading-relaxed">
                                İnovasyon Teşviki: Prototipler, şirket içinde inovasyon kültürünü teşvik eder. Yaratıcı fikirlerin somut bir şekilde ifade edilmesini sağlar ve ekip üyelerinin katkılarını görmelerine olanak tanır.
                            </p>
                        </div>
                    </motion.div>

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative h-[320px] rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/arge-3.png"
                            alt="Planlama"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 4. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="text-xl md:text-lg font-medium text-[var(--color-brand)] leading-relaxed"
                    >
                        ARGE ve prototip geliştirme süreçleri, bir organizasyonun sürdürülebilirliğini sağlamak, rekabet avantajı elde etmek ve müşteri ihtiyaçlarına daha iyi yanıt verebilmek için önemli araçlardır. İyi planlanmış ARGE ve etkili prototip geliştirme süreçleri, bir şirketin büyümesine ve başarılı olmasına katkıda bulunabilir.
                    </motion.p>
                </div>
            </section>

        </main>
    );
}
