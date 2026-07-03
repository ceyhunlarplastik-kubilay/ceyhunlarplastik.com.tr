"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion } from "motion/react"

function splitTitleLines(title: string) {
    const words = title.trim().split(/\s+/).filter(Boolean)

    if (words.length <= 2) {
        return {
            firstLine: words.join(" "),
            secondLine: "",
        }
    }

    return {
        firstLine: words.slice(0, 2).join(" "),
        secondLine: words.slice(2).join(" "),
    }
}

type Props = {
    title: string
    fitToContainer?: boolean
}

export function AnimatedSplitProductTitle({ title, fitToContainer = true }: Props) {
    const rootRef = useRef<HTMLSpanElement | null>(null)
    const [fontSizePx, setFontSizePx] = useState<number | null>(null)
    const lines = useMemo(() => {
        const { firstLine, secondLine } = splitTitleLines(title)
        return [firstLine, secondLine].filter(Boolean)
    }, [title])

    const updateFontSize = useCallback(() => {
        if (!fitToContainer) return

        const root = rootRef.current
        const parent = root?.parentElement
        if (!root || !parent) return

        const availableWidth = root.clientWidth
        if (!availableWidth) return

        const styles = window.getComputedStyle(parent)
        const parentFontSize = Number.parseFloat(styles.fontSize)
        if (!Number.isFinite(parentFontSize) || parentFontSize <= 0) return

        const canvas = document.createElement("canvas")
        const context = canvas.getContext("2d")
        if (!context) return

        context.font = [
            styles.fontStyle,
            styles.fontVariant,
            styles.fontWeight,
            `${parentFontSize}px`,
            styles.fontFamily,
        ].join(" ")

        const widestLine = Math.max(...lines.map((line) => context.measureText(line).width), 1)
        const cursorReservePx = 8
        const nextFontSize = Math.min(
            parentFontSize,
            Math.max(16, parentFontSize * (availableWidth / (widestLine + cursorReservePx))),
        )

        setFontSizePx((current) => (
            current !== null && Math.abs(current - nextFontSize) < 0.5
                ? current
                : nextFontSize
        ))
    }, [fitToContainer, lines])

    useEffect(() => {
        if (!fitToContainer) return

        updateFontSize()

        const root = rootRef.current
        if (!root) return

        const resizeObserver = new ResizeObserver(() => updateFontSize())
        resizeObserver.observe(root)

        return () => resizeObserver.disconnect()
    }, [fitToContainer, updateFontSize])

    return (
        <span
            ref={rootRef}
            className="block max-w-full leading-[1.08]"
            style={fitToContainer && fontSizePx ? { fontSize: `${fontSizePx}px` } : undefined}
        >
            <span className="sr-only">{title}</span>
            {lines.map((line, index) => (
                <span key={`${line}-${index}`} className="block overflow-hidden">
                    <motion.span
                        aria-hidden="true"
                        className="inline-block max-w-none whitespace-nowrap"
                        initial={{ clipPath: "inset(0 100% 0 0)" }}
                        animate={{ clipPath: "inset(0 0% 0 0)" }}
                        transition={{
                            delay: index * 0.28,
                            duration: Math.min(0.72, Math.max(0.32, line.length * 0.018)),
                            ease: [0.22, 1, 0.36, 1],
                        }}
                    >
                        {line}
                    </motion.span>
                    {index === lines.length - 1 ? (
                        <motion.span
                            aria-hidden="true"
                            className="ml-1 inline-block h-[0.82em] w-[2px] translate-y-[0.08em] rounded-full bg-[var(--color-brand)]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0, 1, 0] }}
                            transition={{
                                delay: 0.25 + index * 0.28 + Math.min(0.72, Math.max(0.32, line.length * 0.018)),
                                duration: 0.9,
                                ease: "easeInOut",
                            }}
                        />
                    ) : null}
                </span>
            ))}
        </span>
    )
}
