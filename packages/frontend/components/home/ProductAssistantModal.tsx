"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { motion, AnimatePresence } from "motion/react"
import { Sparkles, X, ArrowRight, CheckCircle2 } from "lucide-react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { ProductAttribute } from "@/features/public/productAttributes/types"

type AttributeValue = {
    id: string
    name: string
    slug: string
    parentValueId?: string | null
    assets?: {
        id: string
        role: string
        url: string
    }[]
}

type Props = {
    attributes: ProductAttribute[]
}

const STEP_TITLES = [
    "Karşılama",
    "Sektör",
    "Üretim Grubu ve Kullanım Alanı",
]

export default function ProductAssistantModal({ attributes }: Props) {
    const router = useRouter()

    const [open, setOpen] = useState(true)
    const [step, setStep] = useState(0)

    const [selectedSectorSlug, setSelectedSectorSlug] = useState<string | null>(null)
    const [selectedProductionGroupSlug, setSelectedProductionGroupSlug] = useState<string | null>(null)
    const [selectedUsageAreaSlugs, setSelectedUsageAreaSlugs] = useState<string[]>([])

    const [query, setQuery] = useState("")
    const [activeProductionGroupSlug, setActiveProductionGroupSlug] = useState<string | null>(null)
    const usageScrollRef = useRef<HTMLDivElement | null>(null)
    const productionSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

    const attrsByCode = useMemo(
        () => new Map(attributes.map((attribute) => [attribute.code, attribute])),
        [attributes]
    )

    const sectorValues = useMemo(
        () => (attrsByCode.get("sector")?.values ?? []) as AttributeValue[],
        [attrsByCode]
    )
    const productionGroupValues = useMemo(
        () => (attrsByCode.get("production_group")?.values ?? []) as AttributeValue[],
        [attrsByCode]
    )
    const usageAreaValues = useMemo(
        () => (attrsByCode.get("usage_area")?.values ?? []) as AttributeValue[],
        [attrsByCode]
    )

    const sectorBySlug = useMemo(
        () => new Map(sectorValues.map((value) => [value.slug, value])),
        [sectorValues]
    )

    const productionGroupBySlug = useMemo(
        () => new Map(productionGroupValues.map((value) => [value.slug, value])),
        [productionGroupValues]
    )

    const selectedSectorId = selectedSectorSlug ? sectorBySlug.get(selectedSectorSlug)?.id : undefined
    const visibleProductionGroups = useMemo(() => {
        if (!selectedSectorId) return productionGroupValues
        return productionGroupValues.filter((value) => value.parentValueId === selectedSectorId)
    }, [productionGroupValues, selectedSectorId])

    const usageAreasByProductionGroup = useMemo(() => {
        const normalized = query.trim().toLowerCase()
        const result = new Map<string, AttributeValue[]>()
        for (const group of visibleProductionGroups) {
            const values = usageAreaValues.filter((value) => value.parentValueId === group.id)
            const filtered = normalized
                ? values.filter((value) => value.name.toLowerCase().includes(normalized))
                : values
            result.set(group.slug, filtered)
        }
        return result
    }, [visibleProductionGroups, usageAreaValues, query])

    const totalFilteredUsageAreaCount = useMemo(() => {
        let total = 0
        for (const values of usageAreasByProductionGroup.values()) total += values.length
        return total
    }, [usageAreasByProductionGroup])

    function handleSelectSector(slug: string) {
        setSelectedSectorSlug(slug)
        setSelectedProductionGroupSlug(null)
        setActiveProductionGroupSlug(null)
        setSelectedUsageAreaSlugs([])
        setQuery("")
        setTimeout(() => setStep(2), 140)
    }

    function handleSelectProductionGroup(slug: string) {
        setSelectedProductionGroupSlug(slug)
        setActiveProductionGroupSlug(slug)
        const section = productionSectionRefs.current[slug]
        const scrollContainer = usageScrollRef.current
        if (!section || !scrollContainer) return
        const top = section.offsetTop - 8
        scrollContainer.scrollTo({ top, behavior: "smooth" })
    }

    function toggleUsageArea(slug: string) {
        setSelectedUsageAreaSlugs((prev) =>
            prev.includes(slug) ? prev.filter((value) => value !== slug) : [...prev, slug]
        )
    }

    function getValueImageUrl(value: AttributeValue) {
        if (!value.assets?.length) return null
        const primary = value.assets.find((asset) => asset.role === "PRIMARY")
        return primary?.url ?? value.assets[0]?.url ?? null
    }

    function goNext() {
        setStep((prev) => Math.min(prev + 1, 2))
    }

    function goBack() {
        setStep((prev) => Math.max(prev - 1, 0))
    }

    function closeAndReset() {
        setOpen(false)
        setStep(0)
        setQuery("")
        setActiveProductionGroupSlug(null)
    }

    function goToFilter() {
        const params = new URLSearchParams()
        if (selectedSectorSlug) params.set("sector", selectedSectorSlug)
        if (selectedProductionGroupSlug) params.set("production_group", selectedProductionGroupSlug)
        if (selectedUsageAreaSlugs.length > 0) params.set("usage_area", selectedUsageAreaSlugs.join(","))
        params.set("page", "1")
        params.set("limit", "12")

        setOpen(false)
        router.push(`/urunler/filtre?${params.toString()}`)
    }

    const canContinue = step === 1
        ? Boolean(selectedSectorSlug)
        : true

    useEffect(() => {
        if (step !== 2) return
        if (!visibleProductionGroups.length) return
        const current = selectedProductionGroupSlug ?? activeProductionGroupSlug
        if (current && visibleProductionGroups.some((value) => value.slug === current)) return
        const first = visibleProductionGroups[0]?.slug ?? null
        setSelectedProductionGroupSlug(first)
        setActiveProductionGroupSlug(first)
    }, [step, visibleProductionGroups, selectedProductionGroupSlug, activeProductionGroupSlug])

    useEffect(() => {
        if (step !== 2) return
        const container = usageScrollRef.current
        if (!container) return

        const onScroll = () => {
            const threshold = container.scrollTop + 24
            let nextActive: string | null = activeProductionGroupSlug
            for (const group of visibleProductionGroups) {
                const el = productionSectionRefs.current[group.slug]
                if (!el) continue
                if (el.offsetTop <= threshold) nextActive = group.slug
            }
            if (nextActive && nextActive !== activeProductionGroupSlug) {
                setActiveProductionGroupSlug(nextActive)
            }
        }

        container.addEventListener("scroll", onScroll, { passive: true })
        onScroll()
        return () => container.removeEventListener("scroll", onScroll)
    }, [step, visibleProductionGroups, activeProductionGroupSlug])

    return (
        <>
            {!open && (
                <motion.button
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setOpen(true)}
                    className="
                        fixed bottom-8 right-10 z-50
                        w-16 h-16
                        rounded-full
                        bg-gradient-to-br from-[var(--color-brand)] to-[color-mix(in_oklch,var(--color-brand),black_20%)]
                        text-white
                        shadow-[0_8px_30px_rgba(0,0,0,0.15)]
                        flex items-center justify-center
                        cursor-pointer
                        group
                    "
                    aria-label="Ürün Asistanı"
                >
                    <div className="relative flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="w-7 h-7 transition-transform duration-300 group-hover:scale-110"
                        >
                            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                            <path d="m3.3 7 8.7 5 8.7-5" />
                            <path d="M12 22V12" />
                        </svg>
                        <Sparkles className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                    </div>

                    <span className="absolute inset-0 rounded-full bg-[var(--color-brand)] opacity-30 animate-ping" />
                    <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                </motion.button>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    showCloseButton={false}
                    className="w-[min(1020px,calc(100vw-1.5rem))] h-[min(88vh,760px)] p-0 overflow-hidden rounded-2xl border-neutral-200"
                >
                    <DialogTitle className="sr-only">Ürün Asistanı</DialogTitle>
                    <div className="flex h-full flex-col">
                        <div className="bg-gradient-to-r from-[var(--color-brand)] to-[color-mix(in_oklch,var(--color-brand),black_15%)] px-6 py-4 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                                        <Sparkles className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold">Ürün Asistanı</p>
                                        <p className="text-xs text-white/80">{STEP_TITLES[step]}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeAndReset}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-white/20 hover:bg-white/30"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-1">
                                {[0, 1, 2].map((index) => (
                                    <div key={index} className="h-1 rounded-full bg-white/25">
                                        <motion.div
                                            className="h-full rounded-full bg-white"
                                            animate={{ width: step >= index ? "100%" : "0%" }}
                                            transition={{ duration: 0.25 }}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex-1 overflow-hidden px-6 py-5">
                            <AnimatePresence mode="wait">
                                {step === 0 && (
                                    <motion.div
                                        key="welcome"
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        className="flex h-full flex-col items-center justify-center text-center space-y-8"
                                    >
                                        <motion.div
                                            animate={{
                                                y: [0, -8, 0],
                                                rotate: [0, 5, -5, 0]
                                            }}
                                            transition={{
                                                duration: 6,
                                                repeat: Infinity,
                                                ease: "linear"
                                            }}
                                            className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-neutral-50 shadow-sm border border-neutral-100"
                                        >
                                            <div className="absolute inset-0 bg-brand/5 rounded-3xl blur-xl" />
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 24 24"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="1.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                className="w-12 h-12 text-brand relative z-10"
                                            >
                                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                                <path d="m3.3 7 8.7 5 8.7-5" />
                                                <path d="M12 22V12" />
                                            </svg>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-1.5 shadow-lg shadow-yellow-200"
                                            >
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </motion.div>
                                        </motion.div>

                                        <div className="space-y-4 max-w-sm">
                                            <h2 className="text-4xl font-bold tracking-tight text-neutral-900 leading-tight">
                                                Merhaba <span className="inline-block animate-bounce">👋</span>
                                            </h2>
                                            <p className="text-base text-neutral-600 leading-relaxed">
                                                İhtiyacınıza en uygun ürünü bulmanızda sizlere rehberlik etmemi ister misiniz?
                                            </p>
                                        </div>

                                        <div className="flex flex-col w-full gap-3 max-w-sm px-4">
                                            <Button
                                                onClick={() => setStep(1)}
                                                className="h-14 text-lg font-semibold bg-brand text-white shadow-lg shadow-brand/20 transition-all hover:translate-y-[-2px] active:scale-95"
                                            >
                                                Evet, Başlayalım
                                                <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={closeAndReset}
                                                className="h-12 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 px-4"
                                            >
                                                Şimdilik hayır, kendim bakarım
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}

                                {step === 1 && (
                                    <motion.div
                                        key="sector"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold">Faaliyet sektörünüzü seçin</h3>
                                            <p className="text-sm text-neutral-500">Tek seçim yapın.</p>
                                        </div>
                                        <ScrollArea type="always" scrollHideDelay={0} className="h-[430px] rounded-lg border border-neutral-200/70 p-2 pr-3">
                                            <div className="grid grid-cols-2 gap-2 pb-2 md:grid-cols-3 lg:grid-cols-4">
                                                {sectorValues.map((value) => (
                                                    <button
                                                        key={value.id}
                                                        onClick={() => handleSelectSector(value.slug)}
                                                        className={cn(
                                                            "group overflow-hidden rounded-xl border text-left text-sm transition",
                                                            selectedSectorSlug === value.slug
                                                                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)] shadow-sm"
                                                                : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                                                        )}
                                                    >
                                                        <div className="relative aspect-square w-full bg-neutral-100">
                                                            {getValueImageUrl(value) ? (
                                                                <Image
                                                                    src={getValueImageUrl(value)!}
                                                                    alt={value.name}
                                                                    fill
                                                                    loading="lazy"
                                                                    sizes="(max-width: 768px) 40vw, (max-width: 1200px) 22vw, 16vw"
                                                                    className="object-contain p-1 transition duration-300 group-hover:scale-105"
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-xs text-neutral-500">
                                                                    Görsel yok
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="px-3 py-2">
                                                            <p className="line-clamp-2 text-xs font-medium sm:text-sm">{value.name}</p>
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div
                                        key="group-usage"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="flex h-full min-h-0 flex-col gap-4 overflow-hidden"
                                    >
                                        <div>
                                            <h3 className="text-lg font-semibold">Üretim grubunuzu ve kullanım alanınızı seçin</h3>
                                            <p className="text-sm text-neutral-500">Üretim gruplarına tıklayarak ilgili kullanım alanlarına hızlıca geçebilirsiniz.</p>
                                        </div>

                                        <ScrollArea type="always" scrollHideDelay={0} className="rounded-lg border border-neutral-200/70 px-2 py-2">
                                            <div className="flex min-w-max items-center gap-2 pb-2">
                                                {visibleProductionGroups.map((value) => (
                                                    <button
                                                        key={value.id}
                                                        onClick={() => handleSelectProductionGroup(value.slug)}
                                                        className={cn(
                                                            "whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition sm:text-sm",
                                                            (activeProductionGroupSlug ?? selectedProductionGroupSlug) === value.slug
                                                                ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                                                                : "border-neutral-200 hover:border-neutral-300 text-neutral-700"
                                                        )}
                                                    >
                                                        {value.name}
                                                    </button>
                                                ))}
                                            </div>
                                        </ScrollArea>

                                        <div className="relative">
                                            <input
                                                value={query}
                                                onChange={(e) => setQuery(e.target.value)}
                                                placeholder="Kullanım alanı ara..."
                                                className="h-10 w-full rounded-xl border border-neutral-200 px-3 text-sm outline-none focus:border-[var(--color-brand)] focus:ring-2 focus:ring-[var(--color-brand)]/20"
                                            />
                                        </div>

                                        <div
                                            ref={usageScrollRef}
                                            className="h-[320px] overflow-y-auto rounded-xl border border-neutral-200"
                                        >
                                            <div className="space-y-5 p-3">
                                                    {visibleProductionGroups.map((group) => {
                                                        const usageValues = usageAreasByProductionGroup.get(group.slug) ?? []
                                                        if (usageValues.length === 0) return null

                                                        return (
                                                            <div
                                                                key={group.id}
                                                                ref={(el) => {
                                                                    productionSectionRefs.current[group.slug] = el
                                                                }}
                                                                className="space-y-2 scroll-mt-2"
                                                            >
                                                                <h4 className="text-sm font-semibold text-neutral-700">{group.name}</h4>
                                                                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                                                                    {usageValues.map((value) => {
                                                                        const checked = selectedUsageAreaSlugs.includes(value.slug)
                                                                        return (
                                                                            <button
                                                                                key={value.id}
                                                                                type="button"
                                                                                onClick={() => toggleUsageArea(value.slug)}
                                                                                className={cn(
                                                                                    "group overflow-hidden rounded-xl border text-left transition",
                                                                                    checked
                                                                                        ? "border-[var(--color-brand)] bg-[var(--color-brand)]/10 text-[var(--color-brand)]"
                                                                                        : "border-neutral-200 hover:border-neutral-300"
                                                                                )}
                                                                            >
                                                                                <div className="relative aspect-square w-full bg-neutral-100">
                                                                                    {getValueImageUrl(value) ? (
                                                                                        <Image
                                                                                            src={getValueImageUrl(value)!}
                                                                                            alt={value.name}
                                                                                            fill
                                                                                            loading="lazy"
                                                                                            sizes="(max-width: 768px) 36vw, (max-width: 1200px) 18vw, 12vw"
                                                                                            className="object-contain p-1 transition duration-300 group-hover:scale-105"
                                                                                        />
                                                                                    ) : (
                                                                                        <div className="flex h-full w-full items-center justify-center text-[11px] text-neutral-500">
                                                                                            Görsel yok
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex items-center justify-between px-2 py-1.5">
                                                                                    <p className="line-clamp-2 text-[11px] font-medium leading-4">{value.name}</p>
                                                                                    {checked && <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--color-brand)]" />}
                                                                                </div>
                                                                            </button>
                                                                        )
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                    {totalFilteredUsageAreaCount === 0 && (
                                                        <p className="px-1 py-6 text-center text-sm text-neutral-500">
                                                            Sonuç bulunamadı.
                                                        </p>
                                                    )}
                                            </div>
                                        </div>

                                        {selectedUsageAreaSlugs.length > 0 && (
                                            <div className="flex flex-wrap gap-2">
                                                {selectedUsageAreaSlugs.map((slug) => (
                                                    <span
                                                        key={slug}
                                                        className="inline-flex items-center gap-1 rounded-full border border-[var(--color-brand)]/30 bg-[var(--color-brand)]/10 px-2 py-1 text-xs text-[var(--color-brand)]"
                                                    >
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        {usageAreaValues.find((value) => value.slug === slug)?.name ?? slug}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {step > 0 && (
                            <div className="flex items-center justify-between border-t px-6 py-4">
                                <Button variant="outline" onClick={goBack}>
                                    Geri
                                </Button>

                                {step < 2 ? (
                                    <Button
                                        onClick={goNext}
                                        disabled={!canContinue}
                                        className="bg-[var(--color-brand)] text-white"
                                    >
                                        Devam Et
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button onClick={goToFilter} className="bg-[var(--color-brand)] text-white">
                                        Ürünleri Listele
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
