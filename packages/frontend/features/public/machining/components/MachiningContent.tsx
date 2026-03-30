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

export function MachiningContent() {
    return (
        <main className="bg-white">

            {/* HERO */}
            <PageHero
                title="Talaşlı İmalat"
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
                        className="space-y-4"
                    >
                        <h4 className="text-xl font-semibold text-[var(--color-brand)]">
                            Hizmetler
                        </h4>
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900 -mt-4">
                            Talaşlı İmalat Nedir?
                        </h2>

                        <p className="text-muted-foreground leading-relaxed">
                            Talaşlı imalat, metal ve diğer malzemelerin işlenmesinde kullanılan bir üretim yöntemidir. Bu yöntem, genellikle metal parçaların şekillendirilmesi ve işlenmesi için kullanılır ve metal talaşı üretir. Talaşlı imalat, çeşitli alt süreçleri içerir ve genellikle tornalama, frezeleme, delme, taşlama gibi işlemleri kapsar.
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
                            src="/logos/machining-1.png"
                            alt="Talaşlı İmalat"
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
                            src="/logos/machining-2.jpg"
                            alt="Talaşlı İmalat"
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
                                    Tornalama:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Tornalama işlemi, bir malzemenin dönen bir mil üzerindeki bir torna tezgahında döndürülerek, kesici bir takımın malzeme üzerinde şekil oluşturmasını sağlar. Bu yöntem genellikle silindirik parçaların üretilmesinde kullanılır.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Frezeleme:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Frezeleme, bir malzemenin üzerinde dönen bir kesici takımın, istenilen şekli oluşturması için malzeme üzerine sabitlenmiş bir tezgah üzerinde hareket etmesini içerir. Bu yöntem, düz yüzeylerin, olukların ve kompleks şekillerin üretilmesinde yaygın olarak kullanılır.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Delme:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Delme işlemi, malzeme üzerine delik açmak için kullanılır. Delme işleminde, genellikle dönen bir matkap ucu kullanılarak malzeme üzerinde delikler açılır.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Taşlama:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Taşlama, malzemenin yüzeyini düzeltmek, parlatmak veya belirli bir tolerans içinde şekillendirmek için kullanılır. Taşlama işlemi, genellikle hassas parçaların üretiminde ve yüzey kalitesinin iyileştirilmesinde önemli bir rol oynar.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>
        </main>
    );
}
