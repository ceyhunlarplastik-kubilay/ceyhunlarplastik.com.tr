"use client"

import ColorChangeCards from "@/components/ui/color-change-card";
import { motion } from "motion/react";

export function ServicesSection() {
    return (
        <section className="relative bg-[var(--color-section-bg)] pb-24">
            <div className="mx-auto max-w-7xl px-4">
                <div className="grid grid-cols-1 lg-grid-cols-2 gap-10 items-start">
                    {/* LEFT – TEXT CONTENT */}
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        viewport={{ once: true }}
                        animate={{ opacity: 1 }}
                    >
                        <h2 className="text-xl md:text-2xl font-bold text-brand mb-2">
                            Ceyhunlar
                        </h2>
                        <h3 className="text-2xl md:text-3xl font-semibold text-muted-foreground mb-2">
                            Projeden Seri Üretime
                        </h3>
                    </motion.div>
                    <ColorChangeCards />
                </div>
            </div>
        </section>
    );
}
