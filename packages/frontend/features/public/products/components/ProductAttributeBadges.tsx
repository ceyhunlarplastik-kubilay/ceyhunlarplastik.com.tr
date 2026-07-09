"use client"
import { useState } from "react"
import { motion } from "motion/react"
import { useTranslations } from "next-intl"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

type ProductAttributeValue = {
    id: string
    name: string
    slug: string
    attribute?: {
        code?: string | null
        name?: string | null
    } | null
}

type AttributeGroup = {
    attributeName: string
    values: ProductAttributeValue[]
}

type Props = {
    attributeValues: ProductAttributeValue[]
}

function formatAttributeName(value: unknown, fallback: string) {
    const text = typeof value === "string" ? value.trim() : ""

    if (!text) return fallback

    return text
        .toLocaleLowerCase("tr-TR")
        .split(/\s+/)
        .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
        .join(" ")
}

export default function ProductAttributeBadges({ attributeValues }: Props) {
    const router = useRouter()
    const t = useTranslations("public.productDetail")
    const attributeFallback = t("attributeFallback")
    const [usageAreasExpanded, setUsageAreasExpanded] = useState(false)

    if (!attributeValues || attributeValues.length === 0) return null

    const grouped = attributeValues.reduce<Record<string, AttributeGroup>>((acc, val) => {
        const code = val.attribute?.code ?? val.attribute?.name ?? "other"
        if (!acc[code]) {
            acc[code] = {
                attributeName: val.attribute?.name ?? attributeFallback,
                values: [],
            }
        }
        acc[code].values.push(val)
        return acc
    }, {})

    const specialCodes = ["sector", "production_group", "usage_area"]
    const allEntries = Object.entries(grouped).sort(([aCode, aData], [bCode, bData]) => {
        const aSpecial = specialCodes.includes(aCode)
        const bSpecial = specialCodes.includes(bCode)
        if (aSpecial !== bSpecial) return aSpecial ? 1 : -1
        return aData.attributeName.localeCompare(bData.attributeName, "tr")
    })

    const normalEntries = allEntries.filter(([code]) => !specialCodes.includes(code))
    const specialEntries = specialCodes
        .map((code) => [code, grouped[code]] as const)
        .filter((entry): entry is readonly [string, AttributeGroup] => Boolean(entry[1]))

    const visibleNormalEntries = normalEntries

    return (
        <div className="space-y-4">

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                {visibleNormalEntries.map(([attributeCode, group], i) => (

                    <motion.div
                        key={attributeCode}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="inline-flex items-center gap-2"
                    >

                        {/* ATTRIBUTE TITLE */}
                        <p className="whitespace-nowrap text-xs font-semibold tracking-[0.01em] text-neutral-500">
                            {formatAttributeName(group.attributeName, attributeFallback)}:
                        </p>

                        {/* VALUES */}
                        <div className="flex flex-wrap items-center gap-1">

                            {group.values.map((val) => (

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
                                        onClick={() => {
                                            const params = new URLSearchParams()

                                            // 🔥 attribute code + value slug
                                            params.set(attributeCode, val.slug)

                                            router.push(`/urunler/filtre?${params.toString()}`)
                                        }}
                                        className="
            relative
            text-xs
            px-2 py-0.5
            rounded-full
            border
            backdrop-blur-sm
            transition-all
            duration-200

            bg-[var(--color-brand)]
            text-[var(--color-brand-foreground)]
            border-[var(--color-brand)]/80

            hover:bg-white
            hover:text-[var(--color-brand)]
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

            {specialEntries.length > 0 && (
                <div className="space-y-3 border-t border-neutral-200 pt-3">
                    {specialEntries.map(([attributeCode, group], index) => (
                        <motion.div
                            key={attributeCode}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.04 }}
                            className="space-y-1.5"
                        >
                            <p className="text-[11px] font-semibold tracking-[0.01em] text-neutral-500">
                                {formatAttributeName(group.attributeName, attributeFallback)}:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {group.values
                                    .slice(
                                        0,
                                        attributeCode === "usage_area" && !usageAreasExpanded
                                            ? 5
                                            : undefined
                                    )
                                    .map((val) => (
                                    <Badge
                                        key={val.id}
                                        onClick={() => {
                                            const params = new URLSearchParams()
                                            params.set(attributeCode, val.slug)
                                            router.push(`/urunler/filtre?${params.toString()}`)
                                        }}
                                        className="
                                            cursor-pointer rounded-full border border-[var(--color-brand)]/75
                                            bg-[var(--color-brand)]/10 px-2 py-0.5 text-xs
                                            text-[var(--color-brand)] transition-colors
                                            hover:bg-[var(--color-brand)] hover:text-[var(--color-brand-foreground)]
                                        "
                                    >
                                        {val.name}
                                    </Badge>
                                ))}
                            </div>
                            {attributeCode === "usage_area" &&
                                group.values.length > 5 && (
                                    <button
                                        onClick={() => setUsageAreasExpanded((prev) => !prev)}
                                        className="text-xs text-[var(--color-brand)] hover:underline"
                                    >
                                        {usageAreasExpanded
                                            ? t("showLess")
                                            : t("showMore", { count: group.values.length - 5 })}
                                    </button>
                                )}
                        </motion.div>
                    ))}
                </div>
            )}

        </div>
    )
}
