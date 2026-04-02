"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Check } from "lucide-react";

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

export function MassProductionMetal() {
    return (
        <>
            {/* ================= 1. BLOCK ================= */}
            <section id="metal" className="py-20">
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
                            Seri Üretim
                        </h2>
                        <h4 className="text-xl font-semibold text-[var(--color-brand)] -mt-4">
                            Sac Metal
                        </h4>

                        <p className="text-muted-foreground leading-relaxed">
                            “Sac metal,” genellikle metal levha veya plakaları ifade eden bir terimdir. Metal endüstrisinde, genellikle çelik, alüminyum veya bakır gibi malzemelerden yapılmış metal levhaları ifade eder. Bu metal levhalar, çeşitli kalınlıklarda ve özelliklerde olabilir ve endüstriyel uygulamalarda, inşaat sektöründe, otomotiv endüstrisinde, gemi yapımında ve birçok başka alanında kullanılır.
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
                            src="/logos/metal.png"
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
                            src="/logos/metal2.png"
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
                                    Malzemeler:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Sac metal, genellikle çelik, alüminyum, bakır, paslanmaz çelik gibi metal malzemelerden yapılır. Malzeme seçimi, uygulama, dayanıklılık ve maliyet faktörleri gibi bir dizi kritere bağlı olarak değişebilir.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Üretim Süreci:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Sac metal, metal plakaların haddeleme veya presleme gibi çeşitli üretim süreçleri kullanılarak istenen kalınlık ve şekle getirilmesiyle üretilir. Metal levhalar, haddeleme makineleri veya presleme ekipmanları aracılığıyla şekillendirilir.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Kullanım Alanları:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Sac metal, birçok endüstri ve sektörde geniş bir kullanım alanına sahiptir. Örneğin, inşaat sektöründe çatı kaplamaları, otomotiv endüstrisinde araç gövdesi parçaları, beyaz eşya üretiminde kaplama panelleri gibi birçok alanda kullanılır.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Çeşitli Kalınlıklar ve Boyutlar:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Sac metal, çok çeşitli kalınlıklarda ve boyutlarda bulunabilir. Bu, belirli uygulama gereksinimlerine uygun olarak seçilebileceği anlamına gelir.
                            </p>
                        </div>
                        <div className="space-y-2 group hover:translate-x-1 transition">
                            {/* ÜST SATIR: ICON + BAŞLIK */}
                            <div className="flex items-center gap-3">
                                <Check className="text-[var(--color-brand)] w-6 h-6 shrink-0" />
                                <h4 className="font-semibold text-[var(--color-brand)]">
                                    Paslanmazlık ve Kaplama:
                                </h4>
                            </div>
                            {/* ALT SATIR: PARAGRAF */}
                            <p className="text-muted-foreground leading-relaxed text-sm pl-9">
                                Paslanmaz çelik sac metal gibi bazı türler, dayanıklılıklarını artırmak için paslanmazlık özelliklerine sahiptir. Ayrıca, bazı durumlarda özel kaplama işlemlerine tabi tutulabilirler.
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
                                Metalin geri dönüşümü, sac metalin sürdürülebilirliğini artırabilir. Geri dönüşüme uygun metal kullanımı, çevresel etkileri azaltabilir ve doğal kaynakları daha verimli bir şekilde kullanabilir.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ================= 3. BLOCK (Centered Summary) ================= */}
            <section className="py-24 bg-neutral-900 text-white overflow-hidden relative">
                {/* Subtle Background Pattern or Decor */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand)]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-[var(--color-brand)]/10 rounded-full -ml-32 -mb-32 blur-3xl" />

                <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="space-y-4"
                    >
                        <h4 className="text-xl md:text-2xl font-semibold text-[var(--color-brand)]">
                            Endüstride Sac Metal Kullanımı
                        </h4>
                        <p className="text-lg md:text-xl text-neutral-300 leading-relaxed font-light italic">
                            “Sac metal, dayanıklılık, mukavemet ve şekillendirilebilirlik gibi avantajları nedeniyle birçok endüstride yaygın olarak tercih edilen bir malzemedir. Bu malzemenin kullanımı, teknolojik gelişmelerle birlikte sürekli olarak evrim geçirir.”
                        </p>
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="w-20 h-1 bg-[var(--color-brand)] mx-auto rounded-full"
                    />

                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="text-neutral-400 leading-relaxed max-w-2xl mx-auto"
                    >
                        Kalıp tasarımı, genellikle metal veya plastik gibi malzemelerden ürünlerin seri üretimi için kullanılan kalıp ya da matrisin tasarım sürecini ifade eder. Bu tasarım süreci, önceden belirlenmiş bir ürünün belirli bir formda, ölçüde ve malzemede üretilmesini sağlamak amacıyla gerçekleştirilir.
                    </motion.p>
                </div>
            </section>


            {/* ================= 4. BLOCK ================= */}
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
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                İhtiyaç Analizi: İlk adım, üretilecek parçanın ihtiyaçları ve gereksinimleri üzerine bir analiz yapmaktır. Bu, parçanın boyutları, malzemesi, dayanıklılığı ve diğer özellikleri içerir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Tasarım Konseptleri: İhtiyaç analizine dayanarak, farklı tasarım konseptleri geliştirilir. Bu konseptler, ürünün şekli, boyutları, malzemesi ve üretim süreci gibi faktörleri içerir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                CAD (Bilgisayar Destekli Tasarım) Modelleme: Seçilen tasarım konseptleri, CAD yazılımı kullanılarak dijital olarak modellenir. Bu adım, ürünün üç boyutlu bir tasarımının oluşturulmasını içerir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Analiz ve Optimizasyon: CAD modeli üzerinde analizler yapılır ve tasarımın dayanıklılığı, akışkanlık, sıcaklık dağılımı gibi faktörler incelenir. Gerekirse, tasarım optimizasyonu yapılır.
                            </p>
                        </div>
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
                            src="/logos/fire.png"
                            alt="Talaşlı İmalat"
                            fill
                            className="object-cover"
                        />
                    </motion.div>
                </div>
            </section>

            {/* ================= 5. BLOCK ================= */}
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
                            src="/logos/profile.jpeg"
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
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Detaylı Tasarım: Seçilen tasarım üzerinde detaylı bir çalışma yapılır. Bu adımda, parçanın her bir detayı, toleranslar, montaj noktaları ve malzeme seçimi belirlenir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Üretim Sürecinin Belirlenmesi: Kalıp tasarımı, üretim sürecinin belirlenmesini içerir. Bu, hangi malzemenin kullanılacağı, kalıp üretim süreci ve kalıp üretimi için gereken ekipmanlar gibi faktörleri içerir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Prototip Üretimi ve Test: Tasarımın bir prototipi üretilir ve test edilir. Bu, tasarımın gerçek dünya koşullarında nasıl performans gösterdiğini değerlendirmek için önemlidir.
                            </p>
                        </div>
                        <div className="flex gap-3 items-start group hover:translate-x-1 transition">
                            <Check className="text-[var(--color-brand)] w-5 h-5 shrink-0 mt-1" />
                            <p className="text-muted-foreground leading-relaxed text-sm">
                                Kalıp Üretimi: Prototip testlerinden sonra, onaylanan tasarıma göre kalıp üretimi gerçekleştirilir. Bu genellikle CNC (Bilgisayarlı Sayısal Kontrol) makineleri veya elektrik deşarj işlemleri gibi yüksek hassasiyetli üretim yöntemleri kullanılarak yapılır.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ================= 6. BLOCK ================= */}
            <section className="py-20 bg-[var(--color-section-bg)]">
                <div className="max-w-7xl mx-auto px-6 text-center">
                    <motion.p
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                        className="text-xl md:text-lg font-medium text-[var(--color-brand)] leading-relaxed"
                    >
                        Kalıp tasarımı, endüstriyel üretim süreçlerinde kritik bir rol oynar ve ürünlerin kalitesi, maliyeti ve üretim hızı üzerinde büyük etkisi bulunmaktadır. İyi bir kalıp tasarımı, ürünlerin daha etkili bir şekilde üretilmesine ve pazarlanmasına olanak tanır.
                    </motion.p>
                </div>
            </section>
        </>
    );
}
