"use client"

import { motion } from "motion/react"

export function CustomerPortalProductGridSkeleton({
    count = 8,
}: {
    count?: number
}) {
    return (
        <ul
            aria-hidden="true"
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
            {Array.from({ length: count }).map((_, index) => (
                <motion.li
                    key={index}
                    initial={{ opacity: 0.4 }}
                    animate={{ opacity: [0.4, 0.82, 0.4] }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: index * 0.05,
                    }}
                    className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm"
                >
                    <div className="aspect-[4/3] bg-gradient-to-br from-neutral-100 via-neutral-50 to-neutral-100" />
                    <div className="space-y-4 p-4">
                        <div className="space-y-2">
                            <div className="h-3 w-20 rounded-full bg-neutral-100" />
                            <div className="h-5 w-4/5 rounded-full bg-neutral-200" />
                            <div className="h-4 w-2/3 rounded-full bg-neutral-100" />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <div className="h-7 w-20 rounded-full bg-neutral-100" />
                            <div className="h-7 w-24 rounded-full bg-neutral-100" />
                            <div className="h-7 w-16 rounded-full bg-neutral-100" />
                        </div>
                    </div>
                </motion.li>
            ))}
        </ul>
    )
}
