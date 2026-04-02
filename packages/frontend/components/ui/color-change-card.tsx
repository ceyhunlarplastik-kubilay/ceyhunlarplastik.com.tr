"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import AnimatedLetter from "@/components/ui/AnimatedLetter";
import { cn } from "@/lib/utils";

export default function ServicesBentoGrid() {
    return (
        <section className="pb-10">
            <div className="mx-auto max-w-7xl px-0 space-y-6">
                {/* ================= TOP GRID (1 Big Left, 2 Right) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[600px]">
                    {/* BIG CARD (Ar-Ge) */}
                    <ServiceCard
                        title="Ar-Ge ve Prototipleme"
                        description="Projenizin numune ve seri üretim öncesinde, ileri çizim ve analiz teknolojilerimizle geliştirilmesi sağlanır."
                        href="/arge-ve-prototipleme"
                        image="/services/rd.jpg" // Placeholder
                        className="h-[400px] lg:h-full"
                        priority
                    />

                    {/* RIGHT COLUMN */}
                    <div className="grid grid-rows-2 gap-6 h-[600px] lg:h-full">
                        <ServiceCard
                            title="3D Baskı ve Tarama"
                            description="Ar-Ge süreci tamamlanan projeleriniz, gerektiğinde taranarak CAD modellemesi yapılır ve 3D baskı ile prototiplenir."
                            href="/3d-baski-ve-tarama"
                            image="/services/3d-printer.jpg" // Placeholder
                        />
                        <ServiceCard
                            title="Talaşlı İmalat"
                            description="Ar-Ge, Analiz ve Prototiplemesi tamamlanan ürünlerinizin seri üretiminin yapılması adına Kalıphane bölümümüzde kalıpların hazırlanması."
                            href="/talasli-imalat"
                            image="/services/cnc-1.jpg" // Placeholder
                        />
                    </div>
                </div>

                {/* ================= BOTTOM ROW (4 Cols) ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <ServiceCard
                        title="Seri Üretim Metal"
                        description="Metal seri imalat kalıpları tamamlanan parçalar, preshane bölümümüzde yüksek hassasiyetle metal seri üretim sürecine alınmaktadır."
                        href="/seri-uretim#metal"
                        image="/services/cnc-3.jpg"
                        className="h-[400px]"
                    />
                    <ServiceCard
                        title="Seri Üretim Plastik"
                        description="Seri imalat kalıpları tamamlanan plastik parçalar, enjeksiyon, şişirme ve ekstrüzyon yöntemleriyle seri üretime alınır."
                        href="/seri-uretim#plastic"
                        image="/services/serial-production.jpg"
                        className="h-[400px]"
                    />
                    <ServiceCard
                        title="Seri Üretim Kauçuk"
                        description="Seri imalat kalıpları tamamlanan kauçuk parçaların hidrolik pres bölümümüzde seri üretiminin yapılması."
                        href="/seri-uretim#rubber"
                        image="/services/rubber-parts-16x9.jpg"
                        className="h-[400px]"
                    />
                    <ServiceCard
                        title="Seri Üretim Bakalit"
                        description="Seri imalat kalıpları tamamlanan bakalit parçaların bakalit enjeksiyon bölümümüzde seri üretimlerinin yapılması."
                        href="/seri-uretim#bakelite"
                        image="/services/rubber-parts-16x9.jpg"
                        className="h-[400px]"
                    />
                </div>
            </div>
        </section>
    );
}

/* --------------------------------------- */

interface ServiceCardProps {
    image: string;
    title: string;
    description: string;
    href?: string;
    className?: string;
    priority?: boolean;
}

function ServiceCard({
    image,
    title,
    description,
    href,
    className,
    priority = false,
}: ServiceCardProps) {
    return (
        <motion.div
            initial="rest"
            whileHover="hover"
            animate="rest"
            variants={{
                rest: { scale: 1 },
                hover: { scale: 1.01 },
            }}
            transition={{ duration: 0.3 }}
            className={cn(
                "group relative overflow-hidden rounded-xl bg-neutral-900",
                href && "cursor-pointer", // UX
                className
            )}
        >
            {href ? (
                <Link href={href} className="absolute inset-0 z-20" />
            ) : null}

            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover grayscale transition-all duration-500 group-hover:grayscale-0 group-hover:scale-105"
                    sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                    priority={priority}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            </div>

            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-5 text-white">
                <h3 className="text-2xl md:text-3xl font-semibold tracking-tight flex flex-wrap">
                    {title.split("").map((char, i) => (
                        <AnimatedLetter
                            key={i}
                            letter={char === " " ? "\u00A0" : char}
                            delay={i * 0.02}
                        />
                    ))}
                </h3>

                <p className="text-sm md:text-base text-gray-200 leading-relaxed opacity-90">
                    {description}
                </p>
            </div>
        </motion.div>
    );
}
