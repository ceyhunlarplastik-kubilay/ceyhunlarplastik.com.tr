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

export function MassProductionRubber() {
    return (
        <>
            <section className="py-20">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-stretch">
                    {/* IMAGE */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="relative w-full aspect-[3/4] lg:aspect-auto lg:h-full rounded-2xl overflow-hidden"
                    >
                        <Image
                            src="/logos/rubber.png"
                            alt="Kauçuk Seri Üretim"
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
                            Seri Üretim
                        </h2>
                        <h4 className="text-xl font-semibold text-[var(--color-brand)] -mt-4">
                            Kauçuk
                        </h4>

                        <p className="text-muted-foreground leading-relaxed">
                            Seri imalat sürecinde hidrolik presler, özellikle kauçuk ürünlerin üretimi için kullanılır. Kauçuk, elastik ve dayanıklı bir malzemedir ve bir dizi endüstride, özellikle otomotiv, elektronik, tıp ve inşaat gibi sektörlerde yaygın olarak kullanılır.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Hidrolik presler, kauçuk ürünlerin seri üretimi için etkili ve verimli bir yöntem sağlar. Bu süreç, kauçuk contalar, conta profilleri, kauçuk parçalar ve benzeri ürünlerin üretiminde yaygın olarak kullanılır.
                        </p>
                    </motion.div>
                </div>
            </section>
        </>
    );
}
