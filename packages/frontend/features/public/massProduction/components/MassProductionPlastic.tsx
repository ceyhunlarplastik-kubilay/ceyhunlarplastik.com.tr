"use client";

import Image from "next/image";
import { motion } from "motion/react";

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

export function MassProductionPlastic() {
    return (
        <>
            <section id="plastic" className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">

                    {/* TEXT */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            Seri Üretim
                        </h2>
                        <h4 className="text-xl font-semibold text-[var(--color-brand)] -mt-4">
                            Plastik Enjeksiyon
                        </h4>

                        <p className="text-muted-foreground leading-relaxed">
                            Plastik enjeksiyon, seri üretimde en yaygın kullanılan yöntemlerden biridir. Eritilmiş plastiğin kalıba yüksek basınçla enjekte edilmesiyle gerçekleştirilen bu süreç, hızlı, tekrarlanabilir ve maliyet açısından verimli bir üretim sağlar.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">Yüksek hassasiyetle üretilen parçalar, otomotiv, beyaz eşya, elektronik, medikal ve ambalaj gibi birçok sektörde kullanılmaktadır.</p>
                        <p className="text-muted-foreground leading-relaxed">Kalıp tasarımındaki çeşitlilik sayesinde çok karmaşık formlar üretilebilmekte ve aynı anda binlerce parça seri olarak elde edilebilmektedir.</p>
                        <p className="text-muted-foreground leading-relaxed">Dayanıklılık, esneklik ve düşük maliyet avantajları sayesinde plastik enjeksiyon, endüstride vazgeçilmez bir imalat yöntemidir.</p>
                    </motion.div>

                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/massp.png"
                            alt="Plastik Enjeksiyon Seri Üretim"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>
        </>
    );
}
