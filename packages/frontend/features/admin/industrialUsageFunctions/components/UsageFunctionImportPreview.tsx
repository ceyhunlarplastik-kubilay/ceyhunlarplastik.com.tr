"use client"

import { useMemo, useState } from "react"
import { AlertTriangle, CircleAlert, Maximize2, Plus, RefreshCw } from "lucide-react"

import { DEFAULT_LOCALE, type SupportedLocale } from "@core/i18n/locales"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
    ADMIN_LOCALE_LABELS,
    adminLocaleFlag,
} from "@/features/admin/shared/translations/adminLocales"
import type { IndustrialUsageFunctionsPayload } from "@/features/admin/industrialUsageFunctions/api/types"
import type {
    UsageFunctionChange,
    UsageFunctionImportDiff,
} from "@/features/admin/industrialUsageFunctions/lib/usageFunctionImportDiff"
import { orderedLocales } from "@/features/admin/industrialUsageFunctions/lib/usageFunctionWorkbookFormat"

/** Bu uzunluğu aşan metin kısaltılır; tamamı dialogda gösterilir. */
const PREVIEW_TEXT_LIMIT = 120

type EnrichedChange = UsageFunctionChange & {
    sector: string
    productionGroup: string
    usageArea: string
}

function buildPreview(value: string) {
    const normalized = value.replace(/\s+/g, " ").trim()

    if (normalized.length <= PREVIEW_TEXT_LIMIT) {
        return { preview: normalized, isTruncated: false }
    }

    const softCutIndex = normalized.lastIndexOf(" ", PREVIEW_TEXT_LIMIT)
    const safeCutIndex = softCutIndex > 0 ? softCutIndex : PREVIEW_TEXT_LIMIT

    return { preview: `${normalized.slice(0, safeCutIndex).trimEnd()}...`, isTruncated: true }
}

function MessageList({
    tone,
    title,
    messages,
}: {
    tone: "error" | "warning"
    title: string
    messages: string[]
}) {
    if (messages.length === 0) return null

    const Icon = tone === "error" ? CircleAlert : AlertTriangle

    return (
        <div
            className={cn(
                "rounded-2xl border p-3",
                tone === "error" ? "border-red-200 bg-red-50/70" : "border-amber-200 bg-amber-50/70",
            )}
        >
            <div
                className={cn(
                    "flex items-center gap-2 text-sm font-semibold",
                    tone === "error" ? "text-red-700" : "text-amber-700",
                )}
            >
                <Icon className="h-4 w-4" />
                {title} ({messages.length})
            </div>
            <ul
                className={cn(
                    "mt-2 space-y-1 text-xs leading-5",
                    tone === "error" ? "text-red-700" : "text-amber-700",
                )}
            >
                {messages.map((message) => (
                    <li key={message} className="wrap-break-word">
                        · {message}
                    </li>
                ))}
            </ul>
        </div>
    )
}

/**
 * Uzun kullanım fonksiyonu metni satırı şişirmesin: kısaltılmış hali görünür,
 * tamamı dialogda. Public ürün sayfasındaki `ProductUsageAreasTable` ile aynı
 * okuma alışkanlığı.
 */
function UsageFunctionCell({
    value,
    tone,
    change,
    label,
}: {
    value: string | null
    tone: "previous" | "next"
    change: EnrichedChange
    label: string
}) {
    const { preview, isTruncated } = useMemo(() => buildPreview(value ?? ""), [value])

    if (!value) {
        return <span className="text-xs italic text-neutral-400">boş</span>
    }

    const textClass = tone === "next" ? "text-neutral-800" : "text-neutral-500"

    if (!isTruncated) {
        return <p className={cn("text-xs leading-5 wrap-break-word", textClass)}>{preview}</p>
    }

    return (
        <Dialog>
            <div className="space-y-1.5">
                <p className={cn("text-xs leading-5 wrap-break-word", textClass)}>{preview}</p>
                <DialogTrigger asChild>
                    <button
                        type="button"
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand transition hover:text-brand/80"
                    >
                        <Maximize2 className="h-3 w-3" />
                        Tamamını gör
                    </button>
                </DialogTrigger>
            </div>

            <DialogContent className="max-w-2xl rounded-3xl">
                <DialogHeader>
                    <DialogTitle>{change.usageArea}</DialogTitle>
                    <DialogDescription>
                        {change.sector} / {change.productionGroup} · {label} ·{" "}
                        {ADMIN_LOCALE_LABELS[change.locale]}
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] pe-4">
                    <div className="text-sm leading-7 whitespace-pre-wrap wrap-break-word text-neutral-700">
                        {value}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function LocaleChangeTable({ changes }: { changes: EnrichedChange[] }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-neutral-200">
            <ScrollArea className="max-h-[420px]">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader className="bg-neutral-50">
                            <TableRow>
                                <TableHead className="w-40">Sektör</TableHead>
                                <TableHead className="w-40">Üretim Grubu</TableHead>
                                <TableHead className="w-48">Kullanım Alanı</TableHead>
                                <TableHead>Mevcut Metin</TableHead>
                                <TableHead>Yeni Metin</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {changes.map((change) => (
                                <TableRow key={`${change.usageId}-${change.locale}`}>
                                    <TableCell className="align-top text-xs text-neutral-600">
                                        {change.sector}
                                    </TableCell>
                                    <TableCell className="align-top text-xs text-neutral-600">
                                        {change.productionGroup}
                                    </TableCell>
                                    <TableCell className="align-top">
                                        <div className="flex items-start gap-1.5">
                                            {change.kind === "created" ? (
                                                <Plus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" />
                                            ) : (
                                                <RefreshCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                                            )}
                                            <div>
                                                <div className="text-xs font-medium text-neutral-800">
                                                    {change.usageArea}
                                                </div>
                                                <div className="text-[11px] text-neutral-400">
                                                    Excel satırı {change.excelRow}
                                                </div>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-xs align-top">
                                        <UsageFunctionCell
                                            value={change.previous}
                                            tone="previous"
                                            change={change}
                                            label="Mevcut metin"
                                        />
                                    </TableCell>
                                    <TableCell className="max-w-xs align-top">
                                        <UsageFunctionCell
                                            value={change.next}
                                            tone="next"
                                            change={change}
                                            label="Yeni metin"
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </ScrollArea>
        </div>
    )
}

export function UsageFunctionImportPreview({
    diff,
    payload,
}: {
    diff: UsageFunctionImportDiff
    payload: IndustrialUsageFunctionsPayload
}) {
    const createdCount = diff.changes.filter((change) => change.kind === "created").length
    const updatedCount = diff.changes.length - createdCount

    /** Değişiklikleri satırın taksonomi bağlamıyla zenginleştirir (id → ad). */
    const changesByLocale = useMemo(() => {
        const rowsById = new Map(payload.rows.map((row) => [row.usageId, row]))

        const taxonomyName = (valueId: string | null | undefined) =>
            valueId ? payload.taxonomy[valueId]?.[DEFAULT_LOCALE] ?? "-" : "-"

        const grouped = new Map<SupportedLocale, EnrichedChange[]>()

        for (const change of diff.changes) {
            const row = rowsById.get(change.usageId)
            const enriched: EnrichedChange = {
                ...change,
                sector: taxonomyName(row?.sectorValueId),
                productionGroup: taxonomyName(row?.productionGroupValueId),
                usageArea: taxonomyName(row?.usageAreaValueId),
            }

            const bucket = grouped.get(change.locale)
            if (bucket) bucket.push(enriched)
            else grouped.set(change.locale, [enriched])
        }

        return grouped
    }, [diff.changes, payload.rows, payload.taxonomy])

    // Sekme sırası her zaman SUPPORTED_LOCALES sırası; yalnız DEĞİŞİKLİĞİ OLAN
    // diller sekme açar — 14 sabit sekmenin 11'i boş olsaydı "kaçırdım mı?"
    // hissi verirdi.
    const localeTabs = useMemo(
        () => orderedLocales().filter((locale) => changesByLocale.has(locale)),
        [changesByLocale],
    )

    const [activeLocale, setActiveLocale] = useState<string | null>(null)
    const currentLocale =
        activeLocale && localeTabs.includes(activeLocale as SupportedLocale)
            ? activeLocale
            : localeTabs[0]

    return (
        <div className="space-y-3">
            <MessageList tone="error" title="Hatalar" messages={diff.errors} />
            <MessageList tone="warning" title="Uyarılar" messages={diff.warnings} />

            <div className="grid gap-2 sm:grid-cols-4">
                {[
                    { label: "Etkilenen satır", value: diff.touchedRows, tone: "neutral" as const },
                    { label: "Yeni çeviri", value: createdCount, tone: "emerald" as const },
                    { label: "Değişen çeviri", value: updatedCount, tone: "amber" as const },
                    { label: "Aynı kalan", value: diff.unchanged, tone: "neutral" as const },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className={cn(
                            "rounded-2xl border px-3 py-2.5",
                            stat.tone === "emerald"
                                ? "border-emerald-200 bg-emerald-50/60"
                                : stat.tone === "amber"
                                    ? "border-amber-200 bg-amber-50/60"
                                    : "border-neutral-200 bg-white",
                        )}
                    >
                        <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-400">
                            {stat.label}
                        </div>
                        <div className="mt-1 text-xl font-semibold text-neutral-950">
                            {stat.value}
                        </div>
                    </div>
                ))}
            </div>

            {currentLocale ? (
                <Tabs value={currentLocale} onValueChange={setActiveLocale} className="gap-3">
                    <div className="overflow-x-auto pb-1">
                        <TabsList className="h-auto flex-nowrap rounded-2xl bg-neutral-100 p-1">
                            {localeTabs.map((locale) => {
                                const localeChanges = changesByLocale.get(locale) ?? []

                                return (
                                    <TabsTrigger
                                        key={locale}
                                        value={locale}
                                        className="gap-1.5 rounded-xl px-3 py-1.5"
                                    >
                                        <span aria-hidden>{adminLocaleFlag(locale)}</span>
                                        {ADMIN_LOCALE_LABELS[locale]}
                                        <Badge
                                            variant="outline"
                                            className="ms-0.5 rounded-full border-neutral-300 px-1.5 text-[10px] font-semibold"
                                        >
                                            {localeChanges.length}
                                        </Badge>
                                    </TabsTrigger>
                                )
                            })}
                        </TabsList>
                    </div>

                    {localeTabs.map((locale) => (
                        <TabsContent key={locale} value={locale}>
                            <LocaleChangeTable changes={changesByLocale.get(locale) ?? []} />
                        </TabsContent>
                    ))}
                </Tabs>
            ) : null}

            {diff.errors.length === 0 && diff.changes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-6 text-center text-sm text-neutral-500">
                    Dosyadaki metinler kayıtlı verilerle aynı — aktarılacak değişiklik yok.
                </p>
            ) : null}
        </div>
    )
}
