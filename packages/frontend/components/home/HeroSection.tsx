"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ClientsMarquee } from "./ClientsMarquee";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const WORDS = ["teamwork", "precision", "engineering", "reliability"];

export function HeroSection() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const id = setInterval(() => {
            setIndex((i) => (i + 1) % WORDS.length);
        }, 2500);
        return () => clearInterval(id);
    }, []);

    return (
        <section
            className="
                relative w-full bg-white overflow-hidden
                lg:h-[calc(100dvh-var(--navbar-height,80px))]
                lg:min-h-[560px]
                lg:max-h-[900px]
                flex flex-col
            "
        >
            {/* HERO CONTENT — takes remaining space */}
            <div className="flex-1 min-h-0 flex items-center">
                <div className="mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-10 xl:px-12 py-10 lg:py-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 xl:gap-20 items-center">
                        {/* LEFT — Text */}
                        <div>
                            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-bold tracking-tight leading-tight">
                                <span className="inline-flex items-baseline gap-3">
                                    <span>Global</span>

                                    {/* Animated word container */}
                                    <span className="relative inline-block min-w-[11ch] overflow-hidden text-brand align-bottom">
                                        <span className="invisible" aria-hidden="true">
                                            {WORDS[index]}
                                        </span>
                                        <AnimatePresence mode="wait">
                                            <motion.span
                                                key={WORDS[index]}
                                                initial={{ y: "100%" }}
                                                animate={{ y: 0 }}
                                                exit={{ y: "-100%" }}
                                                transition={{ duration: 0.5, ease: "easeOut" }}
                                                className="absolute inset-0"
                                            >
                                                {WORDS[index]}
                                            </motion.span>
                                        </AnimatePresence>
                                    </span>
                                </span>
                                <br />
                                plastic solutions
                            </h1>

                            <motion.p
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground"
                            >
                                High-precision plastic component manufacturing with scalable
                                production, certified materials and engineering excellence.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="mt-10 flex flex-wrap gap-4"
                            >
                                <Button variant="brand" size="lg">
                                    Contact us
                                </Button>

                                <Button variant="outline" size="lg">
                                    View products
                                </Button>
                            </motion.div>
                        </div>

                        {/* RIGHT — Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3 }}
                            className="relative"
                        >
                            <div
                                className="
                                    relative w-full overflow-hidden rounded-2xl shadow-xl
                                    aspect-[4/5]
                                    lg:aspect-auto
                                    lg:h-[min(60vh,520px)]
                                    xl:h-[min(64vh,580px)]
                                "
                            >
                                <div className="absolute inset-0 z-10 bg-gradient-to-tr from-black/20 via-transparent to-transparent" />

                                <Image
                                    loader={() =>
                                        "https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2152&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                    }
                                    src="https://images.unsplash.com/photo-1472396961693-142e6e269027?q=80&w=2152&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                                    alt="Plastic manufacturing"
                                    fill
                                    priority
                                    className="object-cover"
                                />
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* MARQUEE — fixed height at bottom */}
            <div className="border-t bg-white shrink-0">
                <div className="mx-auto max-w-8xl px-2 sm:px-4 py-4 lg:py-5">
                    <ClientsMarquee />
                </div>
            </div>
        </section>
    );
}
