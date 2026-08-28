"use client"

import type { CSSProperties } from "react"
import { motion, useReducedMotion } from "motion/react"

import type { PortalCartCarrier } from "@/features/customerPortal/logistics/cartLoad"
import { cn } from "@/lib/utils"

const ASSET_BY_ICON: Record<PortalCartCarrier["icon"], string> = {
    pallet: "/icons/logistics/pallet.svg",
    container: "/icons/logistics/container.svg",
    "curtain-sider": "/icons/logistics/curtain-sider.svg",
}

type Props = {
    carrier: PortalCartCarrier
    fillPercent: number
    ariaValueText: string
    className?: string
}

export function CustomerPortalLoadGraphic({
    carrier,
    fillPercent,
    ariaValueText,
    className,
}: Props) {
    const shouldReduceMotion = useReducedMotion()
    const normalizedFill = Math.min(100, Math.max(0, fillPercent))
    const maskUrl = `url("${ASSET_BY_ICON[carrier.icon]}")`
    const maskStyle: CSSProperties = {
        WebkitMaskImage: maskUrl,
        WebkitMaskPosition: "center",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskImage: maskUrl,
        maskPosition: "center",
        maskRepeat: "no-repeat",
        maskSize: "contain",
    }

    return (
        <div
            role="progressbar"
            aria-label={`${carrier.label} hacim doluluğu`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Number(normalizedFill.toFixed(2))}
            aria-valuetext={ariaValueText}
            className={cn("relative isolate h-44 w-full overflow-hidden", className)}
        >
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-neutral-200"
                style={maskStyle}
            />
            <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-brand"
                style={{ ...maskStyle, transformOrigin: "bottom" }}
                initial={false}
                animate={{ scaleY: normalizedFill / 100 }}
                transition={shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
        </div>
    )
}
