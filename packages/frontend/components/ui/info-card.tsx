"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface InfoCardProps {
    image: string;
    title: string;
    description: string;
    ctaPrimary?: string;
    ctaSecondary?: string;
    className?: string;
}

export function InfoCard({
    image,
    title,
    description,
    ctaPrimary,
    ctaSecondary,
    className,
}: InfoCardProps) {
    return (
        <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className={`relative w-full rounded-2xl overflow-hidden shadow-2xl md:min-h-[450px] ${className}`}
        >
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src={image}
                    alt={title}
                    fill
                    className="object-cover scale-105"
                    priority
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-8 lg:p-10 h-full flex flex-col justify-between">
                {/* TOP */}
                <div className="flex-1 flex flex-col justify-center">
                    <div className="mb-6">
                        <Image
                            src="/logos/logo-text.png"
                            alt="Ceyhunlar Plastik"
                            width={140}
                            height={40}
                            className="h-auto w-auto opacity-90"
                            priority
                        />
                    </div>

                    <h3 className="text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight max-w-sm">
                        {title}
                    </h3>

                    <p className="text-lg lg:text-xl text-white/90 leading-relaxed max-w-sm">
                        {description}
                    </p>
                </div>

                {/* ACTIONS */}
                {(ctaPrimary || ctaSecondary) && (
                    <div className="mt-10 flex flex-wrap gap-4">
                        {ctaPrimary && (
                            <Button variant="brand" size="lg" className="text-lg px-8 py-6">
                                {ctaPrimary}
                            </Button>
                        )}

                        {ctaSecondary && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="text-white text-lg px-8 py-6 bg-white/10 border-white/60 hover:bg-white/15 hover:text-white"
                            >
                                {ctaSecondary}
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </motion.div>
    );
}
