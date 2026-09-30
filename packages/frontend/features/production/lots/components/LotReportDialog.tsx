"use client"

import { useEffect, useMemo } from "react"
import { useFieldArray, useForm, useWatch, type Control } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Boxes, ClipboardCheck, Clock3, MessageSquareText, Plus, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { STOP_CATEGORY_LABELS } from "@core/helpers/production/productionReasons"
import { formatDurationMinutes, wallTimeToUtc } from "@core/helpers/production/productionTime"
import { DialogFormSection } from "@/features/admin/shared/components/DialogFormSection"
import type { LotDetail } from "@/features/production/lots/api/types"
import { useProductionLot, useReportLot } from "@/features/production/lots/hooks/useProductionLots"
import {
    lotReportFormDefaults,
    lotReportFormSchema,
    NO_OPERATOR,
    toLotReportInput,
    type LotReportFormInput,
    type LotReportFormOutput,
} from "@/features/production/lots/schema/lotReportForm"
import { formatLotShiftDay, formatLotTimeRange } from "@/features/production/lots/utils/lotFormat"
import { useProductionOperators } from "@/features/production/operators/hooks/useProductionOperators"
import type { ProductionReason } from "@/features/production/reasons/api/types"
import { useProductionReasons } from "@/features/production/reasons/hooks/useProductionReasons"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"
import { useNow } from "@/features/production/shared/hooks/useNow"
import { formatOperatorName, sortOperators } from "@/features/production/shared/operators"

type Props = { lotNumber: string | null; onOpenChange: (open: boolean) => void }

/**
 * Vardiya raporu: başlangıç / bitiş, çıktı başına sağlam + fire (+ neden kırılımı), duruşlar,
 * opsiyonel baskı ve devir notu. İlk raporda sıradaki lot kendiliğinden başlar; iş tamamlanana
 * kadar düzeltilebilir. Kural `core/helpers/production/lotReports.ts` (sunucuyla aynı).
 */
export function LotReportDialog({ lotNumber, onOpenChange }: Props) {
    const lotQuery = useProductionLot(lotNumber ?? "", { enabled: Boolean(lotNumber) })
    const reasonsQuery = useProductionReasons()
    const lot = lotQuery.data
    const ready = Boolean(lot && reasonsQuery.data)

    return (
        <Dialog open={Boolean(lotNumber)} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(56rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-3xl">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6">
                    <DialogTitle>{lot?.reportedAt ? "Vardiya raporunu düzelt" : "Vardiya raporu"} · {lotNumber}</DialogTitle>
                    <DialogDescription>
                        {lot
                            ? `${formatLotShiftDay(lot)} (${formatLotTimeRange(lot)}) · ${lot.job.machine.code} · ${lot.job.mold.code}`
                            : "Yükleniyor…"}
                    </DialogDescription>
                </DialogHeader>
                {ready && lot && reasonsQuery.data ? (
                    <ReportForm key={`${lot.id}:${lot.job.version}`} lot={lot} reasons={reasonsQuery.data} onDone={() => onOpenChange(false)} />
                ) : (
                    <div className="p-6"><Skeleton className="h-72 rounded-2xl" /></div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function ReportForm({ lot, reasons, onDone }: { lot: LotDetail; reasons: ProductionReason[]; onDone: () => void }) {
    const now = useNow(60_000)
    const reportMutation = useReportLot()
    const operatorsQuery = useProductionOperators()
    const keptReasonIds = useMemo(() => [
        ...lot.stops.map((stop) => stop.reason.id),
        ...lot.outputs.flatMap((output) => output.scrapReasons.map((entry) => entry.reason.id)),
    ], [lot])
    const schema = useMemo(() => lotReportFormSchema({
        jobOutputIds: lot.outputs.map((output) => output.jobOutputId),
        jobStatus: lot.job.status,
        reasons,
        keptReasonIds,
        now,
    }), [lot, reasons, keptReasonIds, now])
    const form = useForm<LotReportFormInput, unknown, LotReportFormOutput>({
        resolver: zodResolver(schema),
        defaultValues: lotReportFormDefaults(lot),
    })
    const stops = useFieldArray({ control: form.control, name: "stops" })
    useEffect(() => { form.reset(lotReportFormDefaults(lot)) }, [lot, form])

    const stopReasons = reasons.filter((reason) => reason.kind === "STOP" && (reason.isActive || keptReasonIds.includes(reason.id)))
    const scrapReasons = reasons.filter((reason) => reason.kind === "SCRAP" && (reason.isActive || keptReasonIds.includes(reason.id)))
    const operators = sortOperators(operatorsQuery.data ?? [])

    const [start, end, stopRows] = useWatch({ control: form.control, name: ["actualStartAt", "actualEndAt", "stops"] })
    const startAt = wallTimeToUtc(start)
    const endAt = wallTimeToUtc(end)
    const lotMinutes = startAt && endAt && endAt > startAt ? (endAt.getTime() - startAt.getTime()) / 60_000 : null
    const stopMinutes = (stopRows ?? []).reduce((sum, stop) => sum + (Number(stop.durationMinutes) || 0), 0)
    const rootIssue = form.formState.errors.outputs?.root?.message ?? form.formState.errors.outputs?.message ?? form.formState.errors.stops?.root?.message ?? form.formState.errors.stops?.message

    async function submit(values: LotReportFormOutput) {
        try {
            const result = await reportMutation.mutateAsync({ lotNumber: lot.lotNumber, input: toLotReportInput(values, lot.job.version) })
            toast.success(`${result.lotNumber} ${result.correction ? "raporu düzeltildi" : "raporlandı"} · ${result.shots.toLocaleString("tr-TR")} baskı`
                + (result.nextLotNumber ? ` · ${result.nextLotNumber} başladı` : ""))
            onDone()
        } catch {
            // Hata mesajı (sürüm çakışması, kapanmış iş) global axios interceptor'ında.
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(submit)} className="flex min-h-0 flex-1 flex-col">
                <div className="min-h-0 flex-1 divide-y overflow-y-auto px-5 sm:px-6">
                    <DialogFormSection icon={<Clock3 />} tone="sky" title="Süre ve baskı" description="Fabrika saatiyle. Baskı boş bırakılırsa adetlerden hesaplanır (en büyük (sağlam + fire) / göz).">
                        <div className="grid items-start gap-3 sm:grid-cols-3">
                            <FormField control={form.control} name="actualStartAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Başlangıç</FormLabel>
                                    <FormControl><Input type="datetime-local" step={60} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="actualEndAt" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Bitiş</FormLabel>
                                    <FormControl><Input type="datetime-local" step={60} {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormNumberField control={form.control} name="actualShots" label="Baskı" unit="sayaç farkı" />
                        </div>
                    </DialogFormSection>

                    <DialogFormSection icon={<Boxes />} tone="emerald" title="Çıktılar" description="Sahada sayılan sağlam ve fire. Fire nedenleri opsiyonel; toplamı fireyi aşamaz, kalanı “belirtilmemiş” sayılır.">
                        <div className="space-y-4">
                            {lot.outputs.map((output, index) => (
                                <OutputFields key={output.jobOutputId} control={form.control} index={index} output={output} scrapReasons={scrapReasons} />
                            ))}
                        </div>
                    </DialogFormSection>

                    <DialogFormSection
                        icon={<TriangleAlert />}
                        tone="amber"
                        title="Duruşlar"
                        description="Vardiya içindeki duruşlar (neden + dakika). Başlangıç saati biliniyorsa girin."
                        aside={<span className="text-xs tabular-nums text-muted-foreground">{stopMinutes} dk{lotMinutes ? ` / ${formatDurationMinutes(lotMinutes)}` : ""}</span>}
                    >
                        <div className="space-y-2">
                            {stops.fields.map((field, index) => (
                                <div key={field.id} className="grid gap-2 rounded-xl border p-2.5 sm:grid-cols-[minmax(0,1fr)_7rem_11rem_auto]">
                                    <FormField control={form.control} name={`stops.${index}.reasonId`} render={({ field: reasonField }) => (
                                        <FormItem>
                                            <Select value={reasonField.value} onValueChange={reasonField.onChange}>
                                                <FormControl><SelectTrigger className="w-full" aria-label="Duruş nedeni"><SelectValue placeholder="Neden" /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    {stopReasons.map((reason) => (
                                                        <SelectItem key={reason.id} value={reason.id}>
                                                            {reason.code} · {reason.name}{reason.stopCategory ? ` (${STOP_CATEGORY_LABELS[reason.stopCategory]})` : ""}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormNumberField control={form.control} name={`stops.${index}.durationMinutes`} label="Süre" unit="dk" required className="[&_label]:sr-only" />
                                    <FormField control={form.control} name={`stops.${index}.startAt`} render={({ field: startField }) => (
                                        <FormItem>
                                            <FormControl><Input type="datetime-local" step={60} aria-label="Duruş başlangıcı (opsiyonel)" {...startField} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <Button type="button" variant="ghost" size="icon" aria-label="Duruşu kaldır" onClick={() => stops.remove(index)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                    <FormField control={form.control} name={`stops.${index}.note`} render={({ field: noteField }) => (
                                        <FormItem className="sm:col-span-4">
                                            <FormControl><Input placeholder="Not (opsiyonel)" maxLength={500} {...noteField} /></FormControl>
                                        </FormItem>
                                    )} />
                                </div>
                            ))}
                            {stopReasons.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Duruş nedeni tanımlı değil — Tanımlar › Duruş ve Fire Nedenleri.</p>
                            ) : (
                                <Button type="button" variant="outline" size="sm" onClick={() => stops.append({ reasonId: "", durationMinutes: "", startAt: "", note: "" })}>
                                    <Plus className="h-4 w-4" />
                                    Duruş ekle
                                </Button>
                            )}
                        </div>
                    </DialogFormSection>

                    <DialogFormSection icon={<MessageSquareText />} title="Vardiya devri" description="Opsiyonel; lota “Vardiya devri” notu olarak eklenir." aside={<span className="text-xs text-muted-foreground">Opsiyonel</span>}>
                        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_14rem]">
                            <FormField control={form.control} name="handoverNote" render={({ field }) => (
                                <FormItem>
                                    <FormControl><Textarea rows={2} maxLength={2000} placeholder="Ör. kalıp ısınıyor, sonraki vardiya soğutmayı kontrol etsin." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="handoverOperatorId" render={({ field }) => (
                                <FormItem>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl><SelectTrigger className="w-full" aria-label="Operatör adına"><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value={NO_OPERATOR}>Yalnız benim notum</SelectItem>
                                            {operators.map((operator) => (
                                                <SelectItem key={operator.id} value={operator.id}>{formatOperatorName(operator)} adına</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />
                        </div>
                    </DialogFormSection>
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-3 border-t px-5 py-3 sm:px-6">
                    {rootIssue ? <p className="text-sm text-destructive">{rootIssue}</p> : (
                        <p className="text-xs text-muted-foreground">
                            {lot.reportedAt ? "Düzeltme: sıradaki lot etkilenmez; kalıp sayacı fark kadar değişir." : "Kaydedince lot kapanır ve sıradaki lot bu lotun bitişinde başlar."}
                        </p>
                    )}
                    <div className="ms-auto flex gap-2">
                        <Button type="button" variant="outline" onClick={onDone}>Vazgeç</Button>
                        <Button type="submit" disabled={reportMutation.isPending}>
                            <ClipboardCheck className="h-4 w-4" />
                            {lot.reportedAt ? "Düzeltmeyi kaydet" : "Raporu kaydet"}
                        </Button>
                    </div>
                </div>
            </form>
        </Form>
    )
}

function OutputFields({
    control,
    index,
    output,
    scrapReasons,
}: {
    control: Control<LotReportFormInput, unknown, LotReportFormOutput>
    index: number
    output: LotDetail["outputs"][number]
    scrapReasons: ProductionReason[]
}) {
    const reasons = useFieldArray({ control, name: `outputs.${index}.scrapReasons` })

    return (
        <fieldset className="space-y-3 rounded-xl border p-3">
            <legend className="px-1 text-sm font-medium">
                <span className="font-mono">{output.sizeCode}</span> {output.productName}
                <span className="font-normal text-muted-foreground">
                    {" "}— {output.order ? output.order.orderNumber : "yan ürün"} · {output.cavities} göz · planlanan {output.plannedQuantity.toLocaleString("tr-TR")}
                </span>
            </legend>
            <div className="grid gap-3 sm:grid-cols-2">
                <FormNumberField control={control} name={`outputs.${index}.goodQuantity`} label="Sağlam" unit="adet" required />
                <FormNumberField control={control} name={`outputs.${index}.scrapQuantity`} label="Fire" unit="adet" required />
            </div>
            <div className="space-y-2">
                {reasons.fields.map((field, reasonIndex) => (
                    <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_7rem_auto] gap-2">
                        <FormField control={control} name={`outputs.${index}.scrapReasons.${reasonIndex}.reasonId`} render={({ field: reasonField }) => (
                            <FormItem>
                                <Select value={reasonField.value} onValueChange={reasonField.onChange}>
                                    <FormControl><SelectTrigger className="w-full" aria-label="Fire nedeni"><SelectValue placeholder="Fire nedeni" /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        {scrapReasons.map((reason) => <SelectItem key={reason.id} value={reason.id}>{reason.code} · {reason.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormNumberField control={control} name={`outputs.${index}.scrapReasons.${reasonIndex}.quantity`} label="Adet" required className="[&_label]:sr-only" />
                        <Button type="button" variant="ghost" size="icon" aria-label="Nedeni kaldır" onClick={() => reasons.remove(reasonIndex)}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ))}
                {scrapReasons.length > 0 ? (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => reasons.append({ reasonId: "", quantity: "" })}>
                        <Plus className="h-3.5 w-3.5" />
                        Fire nedeni ekle
                    </Button>
                ) : null}
            </div>
        </fieldset>
    )
}
