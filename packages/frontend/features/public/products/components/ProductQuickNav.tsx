"use client"

import { useState } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"

// AnimateIcons
import { BoxesIcon } from "@/components/ui/boxes-icon"
import { BoxIcon } from "@/components/ui/box-icon"
import { PaperclipIcon } from "@/components/ui/paperclip-icon"
import { SettingsIcon } from "@/components/ui/settings-icon"
import { FolderOpenIcon } from "@/components/ui/folder-open-icon"
import { PlayIcon } from "@/components/ui/play-icon"
/* import { LayoutGridIcon } from "@/components/ui/layout-grid-icon" */
// import { BadgeCentIcon } from "@/components/ui/badge-cent-icon"

const items = [
    { icon: SettingsIcon, label: "Ölçü ve Seçenekler", target: "product-variants", href: "#product-variants" },
    { icon: BoxesIcon, label: "Endüstriyel Alanlar", target: "usage-area-table", href: "#usage-area-table" },
    { icon: FolderOpenIcon, label: "Teknik Çizim", target: "product-technical-drawing", href: "#product-technical-drawing" },
    /* { icon: LayoutGridIcon, label: "3D Model", target: "product-3d-model", href: "#product-3d-model" }, */
    { icon: BoxIcon, label: "3D Model", target: "product-3d-model", href: "#product-3d-model" },
    { icon: PlayIcon, label: "Montaj Videosu", target: "product-assembly-video", href: "#product-assembly-video" },
    { icon: PaperclipIcon, label: "Hammadde Sertifikası", target: "product-certificate", href: "#product-certificate" },
    /* { icon: CircleCheckIcon, label: "Kalite Belgeleri", target: "quality", href: "#product-variants" }, */
    /* { icon: LayoutGridIcon, label: "Kategori", target: "category", href: "#" }, */
]

const COLS = 3

export default function ProductQuickNav() {
    const [active, setActive] = useState<string | null>(null)

    function scrollTo(id: string) {
        const el = document.getElementById(id)
        if (!el) return

        setActive(id)

        const yOffset = -100
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
                        <Link
                            key={i}
                            href={item.href || "#"}
                            onClick={(e) => {
                                if (item.href?.startsWith("#")) {
                                    e.preventDefault()
                                    scrollTo(item.href.substring(1))
                                }
                            }}
                            className={cn(
                                "relative block transition-all duration-300",
                                !isActive && "hover:bg-neutral-50/50"
                            )}
                        >
                            <motion.div
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
                                    <Icon size={40} />
                                </motion.div>

                                {/* LABEL */}
                                <span
                                    className={cn(
                                        "text-[10px] sm:text-xs text-center font-medium leading-tight",
                                        isActive ? "text-brand" : "text-neutral-500"
                                    )}
                                >
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    )
                })}
            </div>
        </div>
    )
}
