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

export function MassProductionBakalite() {
    return (
        <>
            <section className="py-20">
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
                            Bakalit
                        </h4>

                        <p className="text-muted-foreground leading-relaxed">
                            Bakalit, ısıya ve kimyasallara dayanıklı, sert bir termoset plastiktir. Elektrik yalıtımı özelliği nedeniyle elektrik ve elektronik endüstrisinde yaygın olarak kullanılır. Ayrıca mutfak gereçleri, telefon gövdeleri ve çeşitli endüstriyel ekipmanlarda da tercih edilmektedir.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Kalıplama yöntemiyle istenilen forma kolayca dönüştürülebilen bakalit, yüksek sıcaklıklarda dahi mekanik dayanımını korur. Bu özellikleri sayesinde uzun ömürlü, güvenilir ve maliyet açısından verimli bir malzeme olarak endüstride önemli bir yer tutar.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Günümüzde modern plastiklerin ortaya çıkmasına rağmen, bakalit halen bazı özel uygulamalarda tercih edilmeye devam etmektedir.
                        </p>
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
                            src="/logos/bakalite.png"
                            alt="Bakalit Seri Üretim"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>
        </>
    );
}
