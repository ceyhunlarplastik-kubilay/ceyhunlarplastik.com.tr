"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

// AnimateIcons
import { BoxesIcon } from "@/components/ui/boxes-icon"
// import { BadgeCentIcon } from "@/components/ui/badge-cent-icon"
import { PaperclipIcon } from "@/components/ui/paperclip-icon"
import { SettingsIcon } from "@/components/ui/settings-icon"
import { CircleCheckIcon } from "@/components/ui/circle-check-icon"
import { FolderOpenIcon } from "@/components/ui/folder-open-icon"
import { LayoutGridIcon } from "@/components/ui/layout-grid-icon"

const items = [
    { icon: BoxesIcon, label: "Endüstriyel Alanlar", target: "industrial" },
    { icon: PaperclipIcon, label: "Hammadde Sertifikası", target: "certificate" },
    { icon: SettingsIcon, label: "Teknik Detay", target: "technical" },
    { icon: CircleCheckIcon, label: "Kalite Belgeleri", target: "quality" },
    { icon: FolderOpenIcon, label: "Teknik Çizim", target: "drawing" },
    { icon: LayoutGridIcon, label: "Kategori", target: "category" },
    { icon: BoxesIcon, label: "3D Model", target: "model" }
]

const COLS = 3

export default function ProductQuickNav() {
    const [active, setActive] = useState<string | null>(null)

    function scrollTo(id: string) {
        const el = document.getElementById(id)
        if (!el) return

        setActive(id)

        const yOffset = -80
        const y =
            el.getBoundingClientRect().top +
            window.pageYOffset +
            yOffset

        window.scrollTo({ top: y, behavior: "smooth" })
    }

    return (
        <div className="mt-6 flex justify-center">

            <div className="
                grid
                grid-cols-3
                sm:grid-cols-4
                lg:grid-cols-3
                gap-0
                max-w-5xl
                w-full
                border-t border-b border-neutral-100
            ">

                {items.map((item, i) => {
                    const Icon = item.icon
                    const isActive = active === item.target

                    const isLastCol = (i + 1) % COLS === 0
                    const isLastRow = i >= items.length - (items.length % COLS || COLS)

                    return (
                        <motion.button
                            key={item.target}
                            onClick={() => scrollTo(item.target)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.96 }}
                            className={cn(
                                `
                                flex flex-col items-center justify-center
                                gap-2
                                py-4 px-2
                                transition
                                `,
                                !isLastCol && "border-r border-neutral-100",
                                !isLastRow && "border-b border-neutral-100",
                                isActive ? "text-brand" : "text-neutral-500"
                            )}
                        >

                            {/* ICON */}
                            <motion.div
                                animate={{
                                    y: [0, -6, 0],
                                    scale: [1, 1.06, 1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut",
                                    delay: i * 0.2
                                }}
                                className="text-brand"
                            >
                                {/* <Icon className="
                                    w-14 h-14
                                    sm:w-16 sm:h-16
                                    lg:w-20 lg:h-20
                                " /> */}
                                <Icon size={48} />
                            </motion.div>

                            {/* LABEL */}
                            <span
                                className={cn(
                                    "text-[10px] sm:text-xs text-center leading-tight",
                                    isActive ? "text-brand" : "text-neutral-500"
                                )}
                            >
                                {item.label}
                            </span>
                        </motion.button>
                    )
                })}
            </div>
        </div>
    )
}
