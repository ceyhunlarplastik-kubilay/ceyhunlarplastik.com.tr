"use client"

import { useState, useCallback } from "react"
import { motion, AnimatePresence } from "motion/react"
import { Button } from "@/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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
import { useRouter } from "next/navigation"
import {
    ArrowRight,
    X,
    CheckCircle2,
    Sparkles,
    RotateCcw,
    ChevronsUpDown,
    Check,
    SkipForward,
} from "lucide-react"
import { cn } from "@/lib/utils"

type AttributeValue = {
    id: string
    name: string
    slug: string
}

type Attribute = {
    code: string
    name: string
    values?: AttributeValue[]
}

type Category = {
    id: string
    name: string
    slug: string
}

/* ── Filter step configuration ── */

type FilterStepConfig = {
    code: string          // attribute code in DB
    label: string         // human-readable label
    description: string   // helper text
    placeholder: string   // select placeholder
    searchable?: boolean  // use Combobox instead of Select
}

const FILTER_STEPS: FilterStepConfig[] = [
    {
        code: "usage_area",
        label: "Kullanım Alanı",
        description: "Ürünü hangi alanda kullanacaksınız?",
        placeholder: "Kullanım alanı seçin...",
        searchable: true,
    },
    {
        code: "profile_type",
        label: "Profil Tipi",
        description: "Profil tipini belirleyin",
        placeholder: "Profil tipi seçin...",
    },
    {
        code: "material_type",
        label: "Malzeme Tipi",
        description: "Malzeme tercihini belirleyin",
        placeholder: "Malzeme tipi seçin...",
    },
    {
        code: "model_type",
        label: "Model Tipi",
        description: "Tercih ettiğiniz model tipini seçin",
        placeholder: "Model tipi seçin...",
    },
    {
        code: "connection_type",
        label: "Bağlantı Tipi",
        description: "Bağlantı tipini belirleyin",
        placeholder: "Bağlantı tipi seçin...",
    },
    {
        code: "usage_type",
        label: "Kullanım Tipi",
        description: "Kullanım tipini seçin",
        placeholder: "Kullanım tipi seçin...",
    },
    {
        code: "hat_type",
        label: "Hat Tipi",
        description: "Hat tipini belirleyin",
        placeholder: "Hat tipi seçin...",
    },
]

const TOTAL_STEPS = FILTER_STEPS.length

export default function ProductAssistant({
    attributes,
    categories,
}: {
    attributes: Attribute[]
    categories: Category[]
}) {
    const router = useRouter()

    const [open, setOpen] = useState(false)
    const [currentIndex, setCurrentIndex] = useState(0) // 0..TOTAL_STEPS, TOTAL_STEPS = done

    // answers keyed by attribute code
    const [answers, setAnswers] = useState<Record<string, string>>({})

    // Helper: find attribute by code
    const getAttr = useCallback(
        (code: string) => attributes.find((a) => a.code === code),
        [attributes]
    )

    // Select an answer & advance
    const selectAnswer = useCallback(
        (code: string, value: string) => {
            setAnswers((prev) => ({ ...prev, [code]: value }))
            setCurrentIndex((prev) => Math.min(prev + 1, TOTAL_STEPS))
        },
        []
    )

    // Skip current step
    const skipStep = useCallback(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, TOTAL_STEPS))
    }, [])

    // Reset
    function reset() {
        setCurrentIndex(0)
        setAnswers({})
    }

    // Category mapping
    function mapCategoryFromUsage(usageSlug: string) {
        if (usageSlug.includes("panel")) return "panel-cit-aksesuarlari"
        if (usageSlug.includes("makine")) return "makine-ekipmanlari"
        if (usageSlug.includes("mobilya")) return "mobilya-aksesuarlari"
        return undefined
    }

    // Navigate to results
    function goResult() {
        const params = new URLSearchParams()

        const usageSlug = answers["usage_area"]
        if (usageSlug) {
            const category = mapCategoryFromUsage(usageSlug)
            if (category) params.set("category", category)
        }

        // Set all answered filters
        for (const step of FILTER_STEPS) {
            const val = answers[step.code]
            if (val) params.set(step.code, val)
        }

        params.set("page", "1")
        params.set("limit", "12")

        router.push(`/urunler/filtre?${params.toString()}`)
    }

    const isDone = currentIndex >= TOTAL_STEPS
    const currentStep = !isDone ? FILTER_STEPS[currentIndex] : null

    // Get selected label for a code
    function getSelectedLabel(code: string): string | null {
        const slug = answers[code]
        if (!slug) return null
        const attr = getAttr(code)
        return attr?.values?.find((v) => v.slug === slug)?.name ?? slug
    }

    // Collect selected chips for done screen
    const selectedChips = FILTER_STEPS
        .filter((s) => answers[s.code])
        .map((s) => ({
            code: s.code,
            label: s.label,
            value: getSelectedLabel(s.code)!,
        }))

    // Previous step's selected label (for badge)
    const previousLabel =
        currentIndex > 0
            ? getSelectedLabel(FILTER_STEPS[currentIndex - 1]?.code)
            : null

    return (
        <>
            {/* ──── FAB BUTTON ──── */}
            <AnimatePresence>
                {!open && (
                    <motion.button
                        onClick={() => setOpen(true)}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
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
                        aria-label="Ürün Robotu"
                    >
                        {/* Custom animated product-finder icon */}
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
                                {/* Box body */}
                                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
                                <path d="m3.3 7 8.7 5 8.7-5" />
                                <path d="M12 22V12" />
                            </svg>

                            {/* Sparkle accent */}
                            <Sparkles className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                        </div>

                        {/* Subtle glow */}
                        <span className="absolute inset-0 rounded-full bg-[var(--color-brand)] opacity-30 animate-ping" />

                        {/* Notification dot */}
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* ──── MODAL ──── */}
            <AnimatePresence>
                {open && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none"
                            onClick={() => setOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            initial={{ opacity: 0, y: 60, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 60, scale: 0.9 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 25,
                            }}
                            className="
                                fixed z-50
                                bottom-4 right-4 left-4
                                sm:left-auto sm:w-[380px]
                                sm:bottom-6 sm:right-6
                            "
                        >
                            <div
                                className="
                                    rounded-2xl border border-neutral-200/60
                                    bg-white/95 backdrop-blur-xl
                                    shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)]
                                    overflow-hidden
                                "
                            >
                                {/* ── HEADER ── */}
                                <div className="relative overflow-hidden">
                                    <div
                                        className="
                                            bg-gradient-to-r from-[var(--color-brand)] to-[color-mix(in_oklch,var(--color-brand),black_15%)]
                                            px-5 py-4
                                        "
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">
                                                        Ürün Robotu
                                                    </p>
                                                    <p className="text-[11px] text-white/70">
                                                        Size en uygun ürünü bulalım
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                {currentIndex > 0 && (
                                                    <motion.button
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        onClick={reset}
                                                        className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors cursor-pointer"
                                                        title="Sıfırla"
                                                    >
                                                        <RotateCcw className="w-3.5 h-3.5 text-white" />
                                                    </motion.button>
                                                )}
                                                <button
                                                    onClick={() => setOpen(false)}
                                                    className="w-7 h-7 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center transition-colors cursor-pointer"
                                                >
                                                    <X className="w-3.5 h-3.5 text-white" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Progress bar */}
                                        <div className="mt-3 flex gap-1">
                                            {FILTER_STEPS.map((s, i) => (
                                                <div
                                                    key={s.code}
                                                    className="flex-1 h-1 rounded-full overflow-hidden bg-white/20"
                                                >
                                                    <motion.div
                                                        className="h-full bg-white rounded-full"
                                                        initial={{ width: "0%" }}
                                                        animate={{
                                                            width: i < currentIndex
                                                                ? "100%"
                                                                : i === currentIndex
                                                                    ? "50%"
                                                                    : "0%",
                                                        }}
                                                        transition={{
                                                            duration: 0.5,
                                                            ease: "easeOut",
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* ── CONTENT ── */}
                                <div className="p-5">
                                    <AnimatePresence mode="wait">
                                        {/* Dynamic filter steps */}
                                        {currentStep && (
                                            currentStep.searchable ? (
                                                <SearchableStepSelect
                                                    key={currentStep.code}
                                                    stepNumber={currentIndex + 1}
                                                    totalSteps={TOTAL_STEPS}
                                                    title={getAttr(currentStep.code)?.name ?? currentStep.label}
                                                    description={currentStep.description}
                                                    placeholder={currentStep.placeholder}
                                                    searchPlaceholder={`${currentStep.label} ara...`}
                                                    options={getAttr(currentStep.code)?.values ?? []}
                                                    value={answers[currentStep.code] ?? ""}
                                                    onSelect={(v) => selectAnswer(currentStep.code, v)}
                                                    onSkip={skipStep}
                                                    previousLabel={previousLabel}
                                                />
                                            ) : (
                                                <StepSelect
                                                    key={currentStep.code}
                                                    stepNumber={currentIndex + 1}
                                                    totalSteps={TOTAL_STEPS}
                                                    title={getAttr(currentStep.code)?.name ?? currentStep.label}
                                                    description={currentStep.description}
                                                    placeholder={currentStep.placeholder}
                                                    options={getAttr(currentStep.code)?.values ?? []}
                                                    value={answers[currentStep.code] ?? ""}
                                                    onSelect={(v) => selectAnswer(currentStep.code, v)}
                                                    onSkip={skipStep}
                                                    previousLabel={previousLabel}
                                                />
                                            )
                                        )}

                                        {/* STEP: Done */}
                                        {isDone && (
                                            <motion.div
                                                key="done"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                transition={{ duration: 0.3 }}
                                                className="space-y-4"
                                            >
                                                {/* Summary chips */}
                                                <div className="space-y-2">
                                                    <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                                                        Seçimleriniz
                                                    </p>
                                                    {selectedChips.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {selectedChips.map((chip) => (
                                                                <motion.span
                                                                    key={chip.code}
                                                                    initial={{ opacity: 0, scale: 0.9 }}
                                                                    animate={{ opacity: 1, scale: 1 }}
                                                                    className="
                                                                        inline-flex items-center gap-1
                                                                        px-2.5 py-1
                                                                        text-xs font-medium
                                                                        rounded-full
                                                                        bg-[var(--color-brand)]/10
                                                                        text-[var(--color-brand)]
                                                                        border border-[var(--color-brand)]/20
                                                                    "
                                                                >
                                                                    <CheckCircle2 className="w-3 h-3" />
                                                                    {chip.value}
                                                                </motion.span>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="text-xs text-neutral-400">
                                                            Hiçbir filtre seçilmedi — tüm ürünler gösterilecek.
                                                        </p>
                                                    )}
                                                </div>

                                                <Button
                                                    onClick={goResult}
                                                    className="
                                                        w-full h-11 rounded-xl
                                                        bg-gradient-to-r from-[var(--color-brand)] to-[color-mix(in_oklch,var(--color-brand),black_15%)]
                                                        hover:shadow-lg hover:shadow-[var(--color-brand)]/25
                                                        transition-all duration-300
                                                        text-white font-medium
                                                        cursor-pointer
                                                    "
                                                >
                                                    Ürünleri Görüntüle
                                                    <ArrowRight className="ml-2 w-4 h-4" />
                                                </Button>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}

/* ──────────────────────────────────────────
   Step Select Component (regular)
   ────────────────────────────────────────── */

function StepSelect({
    stepNumber,
    totalSteps,
    title,
    description,
    placeholder,
    options,
    value,
    onSelect,
    onSkip,
    previousLabel,
}: {
    stepNumber: number
    totalSteps: number
    title: string
    description: string
    placeholder: string
    options: { name: string; slug: string }[]
    value: string
    onSelect: (v: string) => void
    onSkip: () => void
    previousLabel?: string | null
}) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
        >
            {/* Previous selection badge */}
            {previousLabel && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="
                        inline-flex items-center gap-1
                        px-2 py-0.5
                        text-[11px] font-medium
                        rounded-full
                        bg-emerald-50 text-emerald-600
                        border border-emerald-100
                    "
                >
                    <CheckCircle2 className="w-3 h-3" />
                    {previousLabel}
                </motion.div>
            )}

            {/* Step label and title */}
            <div>
                <p className="text-[11px] font-semibold text-[var(--color-brand)] uppercase tracking-wider mb-0.5">
                    Adım {stepNumber} / {totalSteps}
                </p>
                <p className="text-sm font-semibold text-neutral-800">{title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </div>

            {/* Select */}
            <Select value={value || undefined} onValueChange={onSelect}>
                <SelectTrigger
                    className="
                        w-full h-11 rounded-xl
                        border-neutral-200 hover:border-[var(--color-brand)]/40
                        transition-colors duration-200
                        focus:ring-[var(--color-brand)]/20
                        text-sm
                    "
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent
                    className="
                        rounded-xl border-neutral-200
                        shadow-xl
                        max-h-[240px]
                    "
                    position="popper"
                    sideOffset={4}
                >
                    {options.map((opt) => (
                        <SelectItem
                            key={opt.slug}
                            value={opt.slug}
                            className="rounded-lg cursor-pointer text-sm"
                        >
                            {opt.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            {/* Skip button */}
            <button
                onClick={onSkip}
                className="
                    flex items-center gap-1 text-xs text-neutral-400
                    hover:text-neutral-600 transition-colors
                    cursor-pointer mx-auto
                "
            >
                <SkipForward className="w-3 h-3" />
                Bu adımı atla
            </button>
        </motion.div>
    )
}

/* ──────────────────────────────────────────
   Searchable Step Select (Combobox)
   ────────────────────────────────────────── */

function SearchableStepSelect({
    stepNumber,
    totalSteps,
    title,
    description,
    placeholder,
    searchPlaceholder,
    options,
    value,
    onSelect,
    onSkip,
    previousLabel,
}: {
    stepNumber: number
    totalSteps: number
    title: string
    description: string
    placeholder: string
    searchPlaceholder: string
    options: { name: string; slug: string }[]
    value: string
    onSelect: (v: string) => void
    onSkip: () => void
    previousLabel?: string | null
}) {
    const [comboOpen, setComboOpen] = useState(false)

    const selectedLabel = options.find((o) => o.slug === value)?.name

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-3"
        >
            {/* Previous selection badge */}
            {previousLabel && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="
                        inline-flex items-center gap-1
                        px-2 py-0.5
                        text-[11px] font-medium
                        rounded-full
                        bg-emerald-50 text-emerald-600
                        border border-emerald-100
                    "
                >
                    <CheckCircle2 className="w-3 h-3" />
                    {previousLabel}
                </motion.div>
            )}

            {/* Step label and title */}
            <div>
                <p className="text-[11px] font-semibold text-[var(--color-brand)] uppercase tracking-wider mb-0.5">
                    Adım {stepNumber} / {totalSteps}
                </p>
                <p className="text-sm font-semibold text-neutral-800">{title}</p>
                <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
            </div>

            {/* Searchable Combobox */}
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="
                            w-full h-11 rounded-xl justify-between
                            border-neutral-200 hover:border-[var(--color-brand)]/40
                            transition-colors duration-200
                            text-sm font-normal
                            cursor-pointer
                        "
                    >
                        <span className={cn(!selectedLabel && "text-muted-foreground")}>
                            {selectedLabel ?? placeholder}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl shadow-xl"
                    align="start"
                    sideOffset={4}
                >
                    <Command>
                        <CommandInput
                            placeholder={searchPlaceholder}
                            className="h-9"
                        />
                        <CommandList className="max-h-[200px]">
                            <CommandEmpty className="py-4 text-center text-sm text-muted-foreground">
                                Sonuç bulunamadı.
                            </CommandEmpty>
                            <CommandGroup>
                                {options.map((opt) => (
                                    <CommandItem
                                        key={opt.slug}
                                        value={opt.name}
                                        onSelect={() => {
                                            onSelect(opt.slug)
                                            setComboOpen(false)
                                        }}
                                        className="rounded-lg cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                value === opt.slug ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {opt.name}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            {/* Skip button */}
            <button
                onClick={onSkip}
                className="
                    flex items-center gap-1 text-xs text-neutral-400
                    hover:text-neutral-600 transition-colors
                    cursor-pointer mx-auto
                "
            >
                <SkipForward className="w-3 h-3" />
                Bu adımı atla
            </button>
        </motion.div>
    )
}