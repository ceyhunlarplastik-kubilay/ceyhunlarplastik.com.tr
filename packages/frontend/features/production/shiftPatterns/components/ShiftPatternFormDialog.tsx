"use client"

import { useEffect, useMemo } from "react"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarClock, Clock3, Loader2, Plus, Save, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"
import {
    findShiftPatternIssues,
    MAX_SHIFTS_PER_PATTERN,
    normalizeShiftDefinitions,
    SHIFT_PATTERN_PRESETS,
    summarizeShiftPattern,
    weekdayShortLabel,
    WEEKDAYS,
} from "@core/helpers/production/shiftPatterns"
import { DialogFormSection, OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ShiftPattern } from "@/features/production/shiftPatterns/api/types"
import { useCreateShiftPattern, useReplaceShiftPattern } from "@/features/production/shiftPatterns/hooks/useShiftPatterns"
import {
    buildShiftPatternPayload,
    createShiftPatternFormDefaults,
    shiftPatternFormSchema,
    toShiftDefinitionInput,
    toShiftFormValues,
    type ShiftPatternFormInput,
    type ShiftPatternFormValues,
} from "@/features/production/shiftPatterns/schema/shiftPatternForm"
import { ShiftPatternTimeline } from "./ShiftPatternTimeline"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    pattern?: ShiftPattern | null
}

function formatHours(minutes: number) {
    return `${Number((minutes / 60).toFixed(2)).toLocaleString("tr-TR")} saat`
}

/**
 * Vardiya düzeni formu (oluşturma + düzenleme). Kaydetmeden önce canlı önizleme:
 * 24 saatlik şerit, günlük süre ve düzen kuralları — sunucunun uyguladığı AYNI
 * fonksiyon (core `findShiftPatternIssues`) ile hesaplanır.
 */
export function ShiftPatternFormDialog({ open, onOpenChange, pattern }: Props) {
    const isEditing = Boolean(pattern)
    const createMutation = useCreateShiftPattern()
    const replaceMutation = useReplaceShiftPattern()
    const isPending = createMutation.isPending || replaceMutation.isPending

    const form = useForm<ShiftPatternFormInput, unknown, ShiftPatternFormValues>({
        resolver: zodResolver(shiftPatternFormSchema),
        defaultValues: createShiftPatternFormDefaults(),
    })
    const { fields, append, remove, replace } = useFieldArray({ control: form.control, name: "shifts" })

    useEffect(() => {
        if (!open) return
        form.reset(createShiftPatternFormDefaults(pattern))
    }, [form, open, pattern])

    const watchedShifts = useWatch({ control: form.control, name: "shifts" })
    const preview = useMemo(() => {
        const normalized = normalizeShiftDefinitions((watchedShifts ?? []).map(toShiftDefinitionInput))
        return {
            normalized,
            issues: findShiftPatternIssues(normalized),
            summary: summarizeShiftPattern(normalized),
        }
    }, [watchedShifts])

    function applyPreset(key: string) {
        const preset = SHIFT_PATTERN_PRESETS.find((entry) => entry.key === key)
        if (!preset) return

        replace(preset.shifts.map(toShiftFormValues))
        if (!form.getValues("name").trim()) {
            form.setValue("name", preset.label, { shouldDirty: true, shouldValidate: true })
        }
    }

    function addShift() {
        const nextCode = String.fromCharCode("A".charCodeAt(0) + fields.length)
        append({ code: nextCode, name: "", startTime: "08:00", durationHours: "8", daysOfWeek: [1, 2, 3, 4, 5, 6] })
    }

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildShiftPatternPayload(values)

        try {
            if (pattern) {
                await replaceMutation.mutateAsync({ id: pattern.id, input: payload })
                toast.success("Vardiya düzeni güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Vardiya düzeni oluşturuldu")
            }
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    const lockDefault = Boolean(pattern?.isDefault)

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[min(60rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(56rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {isEditing ? "Vardiya Düzenini Düzenle" : "Yeni Vardiya Düzeni"}
                    </DialogTitle>
                    <DialogDescription>
                        Makinenin günde kaç saat çalıştığını vardiyalarla tanımlayın. İlk vardiya, vardiya
                        gününün başlangıcıdır; saati ondan önce olan vardiya ertesi güne düşer (gece vardiyası).
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <div className="divide-y px-4 sm:px-6">
                                <DialogFormSection
                                    icon={<CalendarClock />}
                                    title="Düzen"
                                    description="Hazır şablonla başlayıp saatleri ve günleri düzenleyebilirsiniz."
                                    tone="sky"
                                >
                                    <div className="flex flex-wrap gap-2" role="group" aria-label="Hazır şablonlar">
                                        {SHIFT_PATTERN_PRESETS.map((preset) => (
                                            <Button
                                                key={preset.key}
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                className="rounded-full"
                                                onClick={() => applyPreset(preset.key)}
                                            >
                                                {preset.label}
                                            </Button>
                                        ))}
                                    </div>

                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Düzen adı *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Örn. Günde 24 saat · 3 × 8" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="isDefault"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start gap-3 rounded-xl border p-3 sm:mt-6">
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            disabled={lockDefault}
                                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-1">
                                                        <FormLabel>Varsayılan düzen</FormLabel>
                                                        <FormDescription className="text-xs">
                                                            {lockDefault
                                                                ? "Varsayılanlığı devretmek için başka bir düzeni varsayılan yapın."
                                                                : "Kendi düzeni seçilmemiş makine ve alanlar bunu kullanır."}
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="notes"
                                            render={({ field }) => (
                                                <FormItem className="sm:col-span-2">
                                                    <FormLabel>
                                                        Not
                                                        <OptionalFieldHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Textarea rows={2} placeholder="Ör. yaz dönemi, bakalit bölümü..." {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection
                                    icon={<Clock3 />}
                                    title="Vardiyalar"
                                    description="Kod lot ve raporlarda görünür (A, B, C). Süre saat olarak: 8 veya 7,5."
                                    tone="amber"
                                    aside={(
                                        <Badge variant="secondary" className="rounded-full">
                                            {fields.length} / {MAX_SHIFTS_PER_PATTERN}
                                        </Badge>
                                    )}
                                >
                                    <ol className="space-y-3">
                                        {fields.map((item, index) => (
                                            <li key={item.id} className="space-y-3 rounded-2xl border p-3 sm:p-4">
                                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-[5rem_minmax(0,1fr)_8rem_7rem_auto]">
                                                    <FormField
                                                        control={form.control}
                                                        name={`shifts.${index}.code`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Kod</FormLabel>
                                                                <FormControl>
                                                                    <Input maxLength={8} className="uppercase" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`shifts.${index}.name`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Ad</FormLabel>
                                                                <FormControl>
                                                                    <Input placeholder="Gündüz" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`shifts.${index}.startTime`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Başlangıç</FormLabel>
                                                                <FormControl>
                                                                    <Input type="time" step={900} {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <FormField
                                                        control={form.control}
                                                        name={`shifts.${index}.durationHours`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel>Süre (saat)</FormLabel>
                                                                <FormControl>
                                                                    <Input inputMode="decimal" {...field} />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                    <div className="col-span-2 flex items-end justify-end sm:col-span-1">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            aria-label={`${index + 1}. vardiyayı kaldır`}
                                                            disabled={fields.length <= 1}
                                                            onClick={() => remove(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <FormField
                                                    control={form.control}
                                                    name={`shifts.${index}.daysOfWeek`}
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Çalışma günleri</FormLabel>
                                                            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Çalışma günleri">
                                                                {WEEKDAYS.map((day) => {
                                                                    const isActive = field.value.includes(day)
                                                                    return (
                                                                        <Button
                                                                            key={day}
                                                                            type="button"
                                                                            size="sm"
                                                                            variant={isActive ? "default" : "outline"}
                                                                            aria-pressed={isActive}
                                                                            className="h-8 min-w-11 rounded-full px-2"
                                                                            onClick={() => field.onChange(
                                                                                isActive
                                                                                    ? field.value.filter((value) => value !== day)
                                                                                    : [...field.value, day].sort((a, b) => a - b),
                                                                            )}
                                                                        >
                                                                            {weekdayShortLabel(day)}
                                                                        </Button>
                                                                    )
                                                                })}
                                                            </div>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </li>
                                        ))}
                                    </ol>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="rounded-2xl"
                                        disabled={fields.length >= MAX_SHIFTS_PER_PATTERN}
                                        onClick={addShift}
                                    >
                                        <Plus className="h-4 w-4" />
                                        Vardiya ekle
                                    </Button>

                                    <div className="space-y-3 rounded-2xl bg-muted/50 p-3 sm:p-4" aria-live="polite">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                                            <span className="font-medium">Önizleme</span>
                                            <span className="text-muted-foreground">
                                                Günde en fazla {formatHours(preview.summary.maxDailyMinutes)} · haftada{" "}
                                                {formatHours(preview.summary.weeklyMinutes)}
                                            </span>
                                        </div>
                                        {preview.issues.length === 0 ? (
                                            <ShiftPatternTimeline shifts={preview.normalized} />
                                        ) : (
                                            <ul className="space-y-1 text-sm text-destructive">
                                                {preview.issues.map((issue, index) => (
                                                    <li key={`${issue.code}-${index}`} className="flex items-start gap-2">
                                                        <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                                        {issue.message}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                </DialogFormSection>
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isPending ? "Kaydediliyor" : isEditing ? "Değişiklikleri Kaydet" : "Düzeni Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
