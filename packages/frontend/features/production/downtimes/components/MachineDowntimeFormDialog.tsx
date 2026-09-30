"use client"

import { useEffect, useMemo } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Clock, Loader2, Save, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
    downtimeDurationMinutes,
    downtimesOverlap,
    findMachineDowntimeIssues,
} from "@core/helpers/production/machineDowntimes"
import { formatDurationMinutes, formatProductionTimeRange, wallTimeToUtc } from "@core/helpers/production/productionTime"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { MachineDowntime } from "@/features/production/downtimes/api/types"
import {
    useCreateMachineDowntime,
    useUpdateMachineDowntime,
} from "@/features/production/downtimes/hooks/useMachineDowntimes"
import {
    buildMachineDowntimePayload,
    createMachineDowntimeFormDefaults,
    machineDowntimeFormSchema,
    type MachineDowntimeFormValues,
} from "@/features/production/downtimes/schema/machineDowntimeForm"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import { DOWNTIME_KIND_LABELS, DOWNTIME_KIND_OPTIONS } from "@/features/production/shared/downtimeKinds"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    downtime?: MachineDowntime | null
    machines: ProductionMachine[]
    /** Listede yüklü duruşlar — kaydetmeden önce çakışma uyarısı için (asıl kontrol sunucuda). */
    downtimes: MachineDowntime[]
    /** Fabrika takviminde bugün ("YYYY-MM-DD"). */
    today: string
}

export function MachineDowntimeFormDialog({ open, onOpenChange, downtime, machines, downtimes, today }: Props) {
    const isEditing = Boolean(downtime)
    const createMutation = useCreateMachineDowntime()
    const updateMutation = useUpdateMachineDowntime()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<MachineDowntimeFormValues>({
        resolver: zodResolver(machineDowntimeFormSchema),
        defaultValues: createMachineDowntimeFormDefaults(null, { today }),
    })

    useEffect(() => {
        if (!open) return
        // Tek makine varsa yeni kayıtta önceden seçili gelsin.
        const onlyMachineId = machines.length === 1 ? machines[0].id : undefined
        form.reset(createMachineDowntimeFormDefaults(downtime, { today, machineId: onlyMachineId }))
    }, [downtime, form, machines, open, today])

    const [machineId, startAt, endAt] = useWatch({ control: form.control, name: ["machineId", "startAt", "endAt"] })

    const interval = useMemo(() => {
        const start = wallTimeToUtc(startAt)
        const end = wallTimeToUtc(endAt)
        if (!start || !end || findMachineDowntimeIssues({ startAt: start, endAt: end }).length > 0) return null
        return { startAt: start, endAt: end }
    }, [endAt, startAt])

    const overlapping = useMemo(() => {
        if (!interval || !machineId) return null
        return downtimes.find((other) => (
            other.machineId === machineId && other.id !== downtime?.id && downtimesOverlap(other, interval)
        )) ?? null
    }, [downtime?.id, downtimes, interval, machineId])

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildMachineDowntimePayload(values)

        try {
            if (downtime) {
                await updateMutation.mutateAsync({ id: downtime.id, input: payload })
                toast.success("Duruş güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Duruş eklendi")
            }
            onOpenChange(false)
        } catch {
            // Hata mesajı (ör. çakışma — 409) global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-lg">
                <DialogHeader className="text-start">
                    <DialogTitle>{isEditing ? "Duruşu Düzenle" : "Yeni Duruş"}</DialogTitle>
                    <DialogDescription>
                        Makinenin kullanılamayacağı aralık. Saatler fabrika saatiyle (İstanbul) girilir.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="machineId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Makine *</FormLabel>
                                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue placeholder="Makine seçin" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {machines.map((machine) => (
                                                    <SelectItem key={machine.id} value={machine.id}>
                                                        {machine.code} · {machine.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="kind"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tür *</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {DOWNTIME_KIND_OPTIONS.map((option) => (
                                                    <SelectItem key={option.value} value={option.value}>
                                                        {option.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="startAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Başlangıç *</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" step={60} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endAt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Bitiş *</FormLabel>
                                        <FormControl>
                                            <Input type="datetime-local" step={60} min={startAt || undefined} {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {interval ? (
                            <p className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm" aria-live="polite">
                                <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                Süre: {formatDurationMinutes(downtimeDurationMinutes(interval))}
                            </p>
                        ) : null}

                        {overlapping ? (
                            <p
                                className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
                                role="status"
                            >
                                <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>
                                    Bu makinede çakışan bir duruş var: {formatProductionTimeRange(overlapping.startAt, overlapping.endAt)}
                                    {" "}({DOWNTIME_KIND_LABELS[overlapping.kind]}). Aralığı değiştirin ya da o kaydı düzenleyin.
                                </span>
                            </p>
                        ) : null}

                        <FormField
                            control={form.control}
                            name="reason"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Açıklama
                                        <OptionalFieldHint />
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="ör. Hidrolik yağ değişimi, vida-kovan kontrolü" {...field} />
                                    </FormControl>
                                    <FormDescription className="text-xs">
                                        Makinenin durumu (Bakımda / Arızalı) ayrıca makine kartından değiştirilir.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={isPending || Boolean(overlapping)}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isPending ? "Kaydediliyor" : "Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
