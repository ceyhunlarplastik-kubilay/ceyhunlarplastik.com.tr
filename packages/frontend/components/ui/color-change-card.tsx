"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import AnimatedLetter from "@/components/ui/AnimatedLetter";
import { cn } from "@/lib/utils";

// Kart metinleri home.services.cards[] katalogdan; burada yalnız görsel + href + layout.
const cardMeta = [
    { image: "/services/rd.jpg", href: "/arge-ve-prototipleme" },
    { image: "/services/3d-printer.jpg", href: "/3d-baski-ve-tarama" },
    { image: "/services/cnc-1.jpg", href: "/talasli-imalat" },
    { image: "/services/cnc-3.jpg", href: "/seri-uretim#metal" },
    { image: "/services/serial-production.jpg", href: "/seri-uretim#plastic" },
    { image: "/services/rubber-parts-16x9.jpg", href: "/seri-uretim#rubber" },
    { image: "/services/rubber-parts-16x9.jpg", href: "/seri-uretim#bakelite" },
] as const;

export default function ServicesBentoGrid() {
    const t = useTranslations("home.services");
    const cards = t.raw("cards") as { title: string; description: string }[];
    const c = cards.map((card, i) => ({ ...card, ...cardMeta[i] }));

    return (
        <section className="pb-10">
            <div className="mx-auto max-w-7xl px-0 space-y-6">
                {/* ================= TOP GRID (1 Big Left, 2 Right) ================= */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-auto lg:h-[600px]">
                    {/* BIG CARD (Ar-Ge) */}
                    <ServiceCard
                        title={c[0].title}
                        description={c[0].description}
                        href={c[0].href}
                        image={c[0].image}
                        className="h-[400px] lg:h-full"
                        priority
                    />

                    {/* RIGHT COLUMN */}
                    <div className="grid grid-rows-2 gap-6 h-[600px] lg:h-full">
                        <ServiceCard
                            title={c[1].title}
                            description={c[1].description}
                            href={c[1].href}
                            image={c[1].image}
                        />
                        <ServiceCard
                            title={c[2].title}
                            description={c[2].description}
                            href={c[2].href}
                            image={c[2].image}
                        />
                    </div>
                </div>

                {/* ================= BOTTOM ROW (4 Cols) ================= */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {c.slice(3).map((card) => (
                        <ServiceCard
                            key={card.href}
                            title={card.title}
                            description={card.description}
                            href={card.href}
                            image={card.image}
                            className="h-[400px]"
                        />
                    ))}
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
