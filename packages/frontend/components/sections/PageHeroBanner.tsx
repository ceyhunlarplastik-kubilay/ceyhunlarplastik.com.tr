"use client";

import { motion } from "motion/react";
import Image from "next/image";

type Props = {
    title: string;
    backgroundImage?: string;
};

/**
 * Sayfa üstü görsel/renkli banner — yalnız başlığı taşır (iz ayrı, bkz.
 * `PageBreadcrumb`). `PageHero` bunu kullanır ama bağımsız da import edilebilir.
 */
export function PageHeroBanner({
    title,
    backgroundImage = "/logos/title-bg.webp",
}: Props) {
    return (
        <header
            className="
        relative
        h-25
        sm:h-32.5
        md:h-40
        lg:h-45
        flex items-center justify-center
        overflow-hidden
      "
        >
            {/* Background */}
            <Image
                src={backgroundImage}
                alt={title}
                fill
                priority
                sizes="100vw"
                suppressHydrationWarning
                className="object-cover object-center brightness-100 saturate-100"
            />

            {/* Overlays */}
            <div className="absolute inset-0 bg-brand/30 mix-blend-multiply" />
            <div className="absolute inset-0 bg-black/60" />

            {/* Content */}
            <div className="relative z-10 w-full max-w-7xl px-6 mx-auto flex flex-col items-center sm:items-start text-center sm:text-start text-white">
                {/* Title */}
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-bold
            leading-tight
          "
                >
                    {title}
                </motion.h1>
            </div>
        </header>
    );
}
