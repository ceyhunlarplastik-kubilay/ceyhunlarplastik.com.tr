"use client"

import { motion } from "motion/react"

export default function ProductGridSkeleton() {
    return (
        <ul className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
                <motion.li
                    key={i}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 1 }}
                    transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    className="h-40 rounded-2xl bg-neutral-100"
                />
            ))}
        </ul>
    )
}
