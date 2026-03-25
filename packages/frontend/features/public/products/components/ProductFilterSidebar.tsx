"use client"

import { useMemo, useTransition, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "motion/react"
import { Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"

import { useFilterStore } from "@/features/public/products/store/filterStore"

type Category = {
    id: string
    name: string
    slug: string
}

type AttributeValue = {
    id: string
    name: string
    slug: string
}

type Attribute = {
    id: string
    code: string
    name: string
    values?: AttributeValue[]
}

type Props = {
    categories: Category[]
    attributes: Attribute[]
}

export default function ProductFilterSidebar({ categories, attributes }: Props) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    const {
        category,
        attributes: storeAttributes,
        setCategory,
        toggleAttribute,
        toQueryString,
        setFromUrl,
    } = useFilterStore()

    // 🔥 URL → STORE SYNC
    useEffect(() => {
        setFromUrl(new URLSearchParams(searchParams.toString()))
    }, [searchParams])

    function updateUrl() {
        startTransition(() => {
            router.replace(`/urunler/filtre?${toQueryString()}`, { scroll: false })
        })
    }

    function handleCategory(slug: string) {
        setCategory(category === slug ? undefined : slug)
        updateUrl()
    }

    function handleAttribute(code: string, slug: string) {
        toggleAttribute(code, slug)
        updateUrl()
    }

    function clearAll() {
        startTransition(() => {
            router.replace("/urunler/filtre", { scroll: false })
        })
    }

    const hasActiveFilters = useMemo(() => {
        return category || Object.keys(storeAttributes).length > 0
    }, [category, storeAttributes])

    return (
        <aside className="sticky top-24">
            <div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">

                {/* HEADER */}
                <div className="flex items-center justify-between border-b px-5 py-4">
                    <h2 className="text-base font-semibold">Filtreler</h2>

                    {hasActiveFilters && (
                        <Button size="sm" variant="ghost" onClick={clearAll}>
                            <X className="w-4 h-4 mr-1" />
                            Temizle
                        </Button>
                    )}
                </div>

                {/* LOADING BAR */}
                {isPending && (
                    <motion.div
                        className="h-1"
                        style={{ background: "var(--color-brand)" }}
                        animate={{ scaleX: [0.2, 1] }}
                        transition={{ repeat: Infinity, duration: 0.6 }}
                    />
                )}

                <div className="space-y-6 p-5">

                    {/* CATEGORY */}
                    <section>
                        <h3 className="text-xs font-semibold mb-3 text-neutral-500 uppercase tracking-wide">
                            Kategoriler
                        </h3>

                        <div className="flex flex-wrap gap-2">
                            {categories.map((cat) => {
                                const active = category === cat.slug

                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleCategory(cat.slug)}
                                        className={[
                                            "px-3 py-1.5 rounded-full text-xs font-medium transition",
                                            active
                                                ? "bg-[var(--color-brand)] text-white shadow-sm"
                                                : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                                        ].join(" ")}
                                    >
                                        {cat.name}
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* ATTRIBUTES */}
                    {attributes.map((attr) => {
                        const values = attr.values ?? []
                        const selected = storeAttributes[attr.code] ?? []

                        const isLarge = values.length > 8

                        return (
                            <section key={attr.id}>
                                <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">
                                    {attr.name}
                                </h3>

                                {isLarge ? (
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className="w-full justify-between rounded-xl h-10 px-3"
                                            >
                                                <span className="truncate text-left">
                                                    {selected.length > 0
                                                        ? `${selected.length} seçim`
                                                        : `${attr.name} seç`}
                                                </span>

                                                <ChevronsUpDown className="w-4 h-4 opacity-60" />
                                            </Button>
                                        </PopoverTrigger>

                                        <PopoverContent
                                            className="w-[320px] p-0 rounded-2xl border shadow-lg"
                                            align="start"
                                        >
                                            <Command>
                                                <CommandInput placeholder="Ara..." />
                                                <CommandList>
                                                    <CommandEmpty>Bulunamadı</CommandEmpty>

                                                    <CommandGroup>
                                                        <ScrollArea className="h-64">
                                                            {values.map((val) => {
                                                                const checked = selected.includes(val.slug)

                                                                return (
                                                                    <CommandItem
                                                                        key={val.id}
                                                                        onSelect={() => handleAttribute(attr.code, val.slug)}
                                                                        className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer"
                                                                    >
                                                                        <div className="flex items-center gap-2">
                                                                            <Checkbox checked={checked} />
                                                                            <span className="text-sm">{val.name}</span>
                                                                        </div>

                                                                        {checked && (
                                                                            <motion.div
                                                                                initial={{ scale: 0.6, opacity: 0 }}
                                                                                animate={{ scale: 1, opacity: 1 }}
                                                                            >
                                                                                <Check className="w-4 h-4 text-[var(--color-brand)]" />
                                                                            </motion.div>
                                                                        )}
                                                                    </CommandItem>
                                                                )
                                                            })}
                                                        </ScrollArea>
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                ) : (
                                    values.map((val) => {
                                        const checked = selected.includes(val.slug)

                                        return (
                                            <Label
                                                key={val.id}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 transition cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={checked}
                                                    onCheckedChange={() =>
                                                        handleAttribute(attr.code, val.slug)
                                                    }
                                                />
                                                {val.name}
                                            </Label>
                                        )
                                    })
                                )}
                            </section>
                        )
                    })}

                    {/* STATUS */}
                    <div className="text-sm text-neutral-500 flex gap-2 items-center">
                        {isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Search className="w-4 h-4" />}
                        {isPending ? "Filtreleniyor..." : "Hazır"}
                    </div>

                </div>
            </div>
        </aside>
    )
}