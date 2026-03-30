"use client";

import Image from "next/image";
import { motion } from "motion/react";

export function AboutDetails() {
    return (
        <div>

            {/* ================= DEVELOPMENT ================= */}
            <section className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-6">

                    {/* IMAGE */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative w-full max-w-4xl mx-auto h-[300px] md:h-[380px] rounded-3xl overflow-hidden mb-12"
                    >
                        <Image
                            src="/logos/hakkimizda2.jpg"
                            alt="Üretim"
                            fill
                            className="object-cover transition-transform duration-700 hover:scale-105"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        initial={{ opacity: 0, y: 60 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.1 }}
                        className="max-w-5xl mx-auto space-y-6 leading-relaxed text-muted-foreground"
                    >

                        <p className="text-lg md:text-xl text-neutral-900 font-medium">
                            Hizmet vermeye başladığımız günden itibaren gelişen teknolojiyi ve
                            sektörel trendleri yakından takip ederek gelişimimizi sürdürdük,
                            sürdürmeye devam ediyoruz.
                        </p>

                        <p>
                            Bu doğrultuda günümüz ticaretinin ihtiyaçlarını karşılama amacıyla da
                            girişimlerde bulunduk.
                        </p>

                        <p>
                            Müşteri ihtiyaçlarını en doğru şekilde karşılayabilmek adına Ar-Ge
                            yatırımlarımızı artırdık. Bu süreçte Ar-Ge çalışmalarımızda 3D
                            teknolojisinden de faydalandık. 2018 yılında Ar-Ge ve 3D birimimizi
                            faaliyete geçirdik.
                        </p>

                        <p>
                            Bununla birlikte 3D print, planlama, kalıplama, seri üretim, montaj,
                            paketleme ve sevkiyat süreçlerinin tamamını bünyesinde bulunduran bir
                            firma olarak; müşterilerimizin ihtiyaçlarını karşılamayı başardık.
                        </p>

                        <p className="font-medium text-neutral-900">
                            Ceyhunlar Plastik olarak sizin düşündüklerinizi hayata geçiriyoruz.
                        </p>
                    </motion.div>

                </div>
            </section>


            {/* ================= MOTTO ================= */}
            <section className="py-24 bg-white relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">

                    {/* BACKGROUND QUOTE */}
                    <div className="absolute right-10 top-10 text-[200px] text-neutral-200/40 blur-[2px] font-serif select-none pointer-events-none hidden lg:block">
                        “”
                    </div>

                    {/* IMAGE (VERTICAL FULL) */}
                    <motion.div
                        initial={{ opacity: 0, x: -60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="relative h-[420px] md:h-[520px] w-full rounded-3xl overflow-hidden"
                    >
                        <Image
                            src="/motto.png"
                            alt="Motto"
                            fill
                            className="object-contain transition-transform duration-700 hover:scale-105"
                        />
                    </motion.div>

                    {/* TEXT */}
                    <motion.div
                        initial={{ opacity: 0, x: 60 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.7 }}
                        className="space-y-6 relative z-10"
                    >

                        <h2 className="text-2xl md:text-3xl font-semibold text-neutral-900">
                            Plastik İhtiyaçlarınızda{" "}
                            <span className="text-[--color-brand]">Lider</span> Çözüm
                            Ortağınız!
                        </h2>

                        <p className="text-muted-foreground italic text-lg">
                            “Yüksek Kalite ve Güven Standartlarıyla…”
                        </p>

                        <p className="text-lg text-neutral-800 leading-relaxed">
                            Bir şirketin kalbi ve ruhu, yaratıcılık ve yeniliktir.
                            Ancak azim ve işe duyulan sevgi olmadan başarıya ulaşmak mümkün değildir.
                        </p>

                        <p className="text-muted-foreground leading-relaxed">
                            Ceyhunlar Plastik olarak yola çıktığımız ilk günden beri işimize olan
                            tutkumuzu azimle taçlandırıyoruz.
                        </p>

                    </motion.div>

                </div>
            </section>

        </div>
    );
}
