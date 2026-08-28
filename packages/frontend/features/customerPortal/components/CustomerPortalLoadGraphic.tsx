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

function buildLiquidClipPath(fillPercent: number) {
    if (fillPercent <= 0) {
        return "polygon(0% 100%, 20% 100%, 40% 100%, 60% 100%, 80% 100%, 100% 100%, 100% 100%, 0% 100%)"
    }

    if (fillPercent >= 100) {
        return "polygon(0% 0%, 20% 0%, 40% 0%, 60% 0%, 80% 0%, 100% 0%, 100% 100%, 0% 100%)"
    }

    const surface = 100 - fillPercent
    const waveOffsets = [0.35, -0.6, 0.45, -0.5, 0.55, -0.3]
    const surfacePoints = waveOffsets.map((offset, index) => {
        const x = index * 20
        const y = Math.min(100, Math.max(0, surface + offset))
        return `${x}% ${y}%`
    })

    return `polygon(${surfacePoints.join(", ")}, 100% 100%, 0% 100%)`
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
                className="absolute inset-0 bg-brand/[0.62] will-change-[clip-path] motion-reduce:will-change-auto"
                style={maskStyle}
                initial={false}
                animate={{ clipPath: buildLiquidClipPath(normalizedFill) }}
                transition={shouldReduceMotion
                    ? { duration: 0 }
                    : { duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            />
        </div>
    )
}
