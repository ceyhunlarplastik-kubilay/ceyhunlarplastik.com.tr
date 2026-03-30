"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { useState } from "react";

import {
    Dialog,
    DialogContent,
    DialogTrigger,
    DialogTitle,
} from "@/components/ui/dialog";

export default function AboutHero() {
    const [open, setOpen] = useState(false);

    return (
        <section className="
            relative
            min-h-[calc(100dvh-var(--navbar-height))]
            flex
            items-center
            overflow-hidden
        ">
            {/* BACKGROUND */}
            <div className="absolute inset-0 -z-10">
                <Image
                    src="/hakkimizda.jpg"
                    alt="Ceyhunlar Plastik Hakkımızda"
                    fill
                    priority
                    className="object-cover scale-105"
                />

                {/* LIGHTER OVERLAY */}
                <div className="absolute inset-0 bg-black/55" />

                {/* GRADIENT GLOW */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/40" />
            </div>

            <div className="mx-auto max-w-6xl px-6 text-white">
                {/* TITLE */}
                <motion.h1
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-4xl md:text-6xl font-bold leading-tight"
                >
                    Özel Üretimde <br />
                    <span className="text-[var(--color-brand)]">
                        Güvenilir İş Ortağınız
                    </span>
                </motion.h1>

                {/* DESCRIPTION */}
                <motion.p
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.15 }}
                    className="mt-6 max-w-2xl text-lg text-white/90"
                >
                    2001 yılından bu yana güçlü üretim altyapımız ve yenilikçi yaklaşımımız
                    ile müşterilerimizin ihtiyaçlarını en yüksek kalite standartlarında
                    karşılıyoruz.
                </motion.p>

                {/* VIDEO CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="mt-10 flex items-center gap-5"
                >
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogTrigger asChild>
                            <motion.button
                                whileHover={{ scale: 1.08 }}
                                className="relative flex items-center justify-center"
                            >
                                {/* VIDEO PREVIEW (hover) */}
                                <div className="absolute inset-0 rounded-full overflow-hidden blur-md opacity-40">
                                    <Image
                                        src="/logos/hakkimizda2.jpg"
                                        alt="preview"
                                        fill
                                        className="object-cover"
                                    />
                                </div>

                                {/* RIPPLE */}
                                <motion.span
                                    className="absolute h-24 w-24 rounded-full bg-[var(--color-brand)]/30"
                                    animate={{
                                        scale: [1, 1.8],
                                        opacity: [0.5, 0],
                                    }}
                                    transition={{
                                        duration: 2.2,
                                        repeat: Infinity,
                                        ease: "easeOut",
                                    }}
                                />

                                <motion.span
                                    className="absolute h-20 w-20 rounded-full bg-white/20"
                                    animate={{
                                        scale: [1, 1.6],
                                        opacity: [0.6, 0],
                                    }}
                                    transition={{
                                        duration: 2.4,
                                        repeat: Infinity,
                                        delay: 0.4,
                                        ease: "easeOut",
                                    }}
                                />

                                {/* BUTTON */}
                                <span
                                    className="
                    relative z-10
                    flex h-16 w-16 items-center justify-center
                    rounded-full
                    bg-gradient-to-br from-[var(--color-brand)] to-yellow-300
                    text-black
                    shadow-[0_10px_40px_rgba(204,179,110,0.45)]
                  "
                                >
                                    <Play className="h-6 w-6 ml-[2px]" />
                                </span>
                            </motion.button>
                        </DialogTrigger>

                        <DialogContent className="max-w-4xl p-0 overflow-hidden">
                            {/* REQUIRED FOR ACCESSIBILITY */}
                            <DialogTitle className="sr-only">
                                Tanıtım Videosu
                            </DialogTitle>

                            <div className="aspect-video w-full">
                                {open && (
                                    <iframe
                                        className="w-full h-full"
                                        src="https://www.youtube.com/embed/42mrTRiExjs?autoplay=1"
                                        title="Ceyhunlar Tanıtım"
                                        allow="autoplay; encrypted-media"
                                        allowFullScreen
                                    />
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    {/* TEXT */}
                    <span className="text-lg font-medium tracking-wide text-white/90">
                        Tanıtım Videosu
                    </span>
                </motion.div>
            </div>
        </section>
    );
}
