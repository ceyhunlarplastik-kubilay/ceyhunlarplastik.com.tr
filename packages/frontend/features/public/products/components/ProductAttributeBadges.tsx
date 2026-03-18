"use client"

import { motion } from "motion/react"
import { Badge } from "@/components/ui/badge"

type Props = {
    attributeValues: any[]
}

export default function ProductAttributeBadges({ attributeValues }: Props) {

    if (!attributeValues || attributeValues.length === 0) return null

    // 🔥 group by attribute
    const grouped = attributeValues.reduce((acc: any, val: any) => {
        const key = val.attribute.name

        if (!acc[key]) {
            acc[key] = []
        }

        acc[key].push(val)
        return acc
    }, {})

    return (
        <div className="space-y-4">

            {Object.entries(grouped).map(([attributeName, values], i) => (

                <motion.div
                    key={attributeName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="space-y-2"
                >

                    {/* ATTRIBUTE TITLE */}
                    <p
                        className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                        {attributeName}
                    </p>

                    {/* VALUES */}
                    <div className="flex flex-wrap gap-2">

                        {(values as any[]).map((val) => (

                            <motion.div
                                key={val.id}
                                whileHover={{ scale: 1.08, y: -2 }}
                                whileTap={{ scale: 0.95 }}
                                className="relative group"
                            >
                                {/* glow */}
                                <div
                                    className="
            absolute inset-0 rounded-full
            opacity-0 group-hover:opacity-100
            blur-md transition
        "
                                    style={{
                                        background: "var(--color-brand)",
                                    }}
                                />

                                <Badge
                                    className="
            relative
            text-xs
            px-3 py-1
            rounded-full
            border
            backdrop-blur-sm
            transition-all
            duration-200

            bg-white/80
            text-[var(--color-brand)]
            border-[var(--color-brand)]/40

            hover:bg-[var(--color-brand)]
            hover:text-[var(--color-brand-foreground)]
            hover:border-[var(--color-brand)]
        "
                                >
                                    {val.name}
                                </Badge>
                            </motion.div>

                        ))}

                    </div>

                </motion.div>

            ))}

        </div>
    )
}