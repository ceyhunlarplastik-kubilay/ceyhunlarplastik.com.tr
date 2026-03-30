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

export function DContent() {
    return (
        <main className="bg-white">

            {/* HERO */}
            <PageHero
                title="3D Baskı ve Tarama"
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
                            3D Baskı
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                            3D baskı, üç boyutlu nesnelerin katman katman inşa edildiği bir üretim teknolojisidir. Bu teknoloji, bilgisayar destekli tasarım (CAD) yazılımı kullanılarak oluşturulan dijital modelleri fiziksel objelere dönüştürmek için kullanılır. 3D baskı ayrıca “katmanlı imalat” veya “hızlı prototipleme” olarak da bilinir.
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
                            src="/logos/printer.jpg"
                            alt="3D Baskı Yazıcı Printer"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 2. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative w-full aspect-[4/3] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/arges.png"
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
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Çalışma Prensibi:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                3D baskı, bir nesneyi oluşturmak için materyalin katmanlar halinde bir araya getirilmesini sağlar. Bu katmanlar, dijital bir tasarım dosyasından alınan bilgilerle oluşturulur.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Malzemeler:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                3D baskıda kullanılan malzemeler geniş bir yelpazeye sahiptir. Plastik, metal, seramik, reçine ve hatta biyolojik materyaller gibi farklı malzemeler kullanılabilir. Malzame seçimi, nesnenin kullanım amacına ve tasarım gereksinimlerine bağlıdır.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Uygulama Alanları:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                3D baskı, prototip geliştirme, üretim, tıp, eğitim, inşaat, moda ve bir dizi diğer endüstriyel sektörlerde kullanılır. Özellikle, özel ve karmaşık parçaların hızlı üretimi ve prototiplemenin yanı sıra kişiselleştirilmiş ürünlerin üretimi için popülerdir.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Hızlı Prototipleme:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                3D baskı, tasarımların hızlı bir şekilde fiziksel prototiplere dönüştürülmesine olanak tanır. Bu, ürün geliştirme sürecini hızlandırabilir ve maliyetleri düşürebilir.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Sürdürülebilirlik:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                3D baskı, malzame israfını en aza indirme potansiyeli taşır. Geleneksel üretim yöntemlerinden farklı olarak, sadece gerekli malzemenin kullanılmasına olanak tanır.
                            </p>
                        </div>
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
