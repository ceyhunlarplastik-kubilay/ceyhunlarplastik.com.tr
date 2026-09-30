"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, Loader2, Save } from "lucide-react"
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
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectSeparator,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { CalendarExceptionGroup } from "@core/helpers/production/productionCalendar"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionArea } from "@/features/production/areas/api/types"
import type { CalendarException } from "@/features/production/calendar/api/types"
import { useSaveCalendarExceptionEntry } from "@/features/production/calendar/hooks/useCalendarExceptions"
import {
    buildCalendarExceptionEntryPayload,
    calendarExceptionFormSchema,
    createCalendarExceptionFormDefaults,
    describeCalendarEntryPreview,
    FACTORY_SCOPE,
    type CalendarExceptionFormValues,
} from "@/features/production/calendar/schema/calendarExceptionForm"
import type { ProductionMachine } from "@/features/production/machines/api/types"
import { CALENDAR_EXCEPTION_KIND_OPTIONS } from "@/features/production/shared/calendarExceptionKinds"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Düzenlenen kayıt (listedeki birleşik satır); yoksa yeni kayıt. */
    group?: CalendarExceptionGroup<CalendarException> | null
    areas: ProductionArea[]
    machines: ProductionMachine[]
    /** Fabrika takviminde bugün ("YYYY-MM-DD") — yeni kaydın varsayılan başlangıcı. */
    today: string
}

export function CalendarExceptionFormDialog({ open, onOpenChange, group, areas, machines, today }: Props) {
    const isEditing = Boolean(group)
    const saveMutation = useSaveCalendarExceptionEntry()

    const form = useForm<CalendarExceptionFormValues>({
        resolver: zodResolver(calendarExceptionFormSchema),
        defaultValues: createCalendarExceptionFormDefaults(null, today),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createCalendarExceptionFormDefaults(group, today))
    }, [form, group, open, today])

    const [startDate, endDate, kind] = useWatch({ control: form.control, name: ["startDate", "endDate", "kind"] })
    const preview = describeCalendarEntryPreview(startDate, endDate)
    const kindHint = CALENDAR_EXCEPTION_KIND_OPTIONS.find((option) => option.value === kind)?.hint

    const handleSubmit = form.handleSubmit(async (values) => {
        try {
            await saveMutation.mutateAsync(buildCalendarExceptionEntryPayload(values, group?.ids))
            toast.success(isEditing ? "Takvim kaydı güncellendi" : "Takvim kaydı eklendi")
            onOpenChange(false)
        } catch {
            // Hata mesajı (ör. aynı gün dolu — 409) global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-lg">
                <DialogHeader className="text-start">
                    <DialogTitle>{isEditing ? "Takvim Kaydını Düzenle" : "Yeni Takvim Kaydı"}</DialogTitle>
                    <DialogDescription>
                        Bayram, toplu izin ya da ek mesai. Birden çok gün için aralık girin; listede tek satır görünür.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
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
                                            {CALENDAR_EXCEPTION_KIND_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {kindHint ? <FormDescription className="text-xs">{kindHint}</FormDescription> : null}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Başlangıç *</FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Bitiş
                                            <OptionalFieldHint />
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="date" min={startDate || undefined} {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">Boşsa tek gün.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {preview ? (
                            <p className="flex items-center gap-2 rounded-xl border bg-muted/40 px-3 py-2 text-sm" aria-live="polite">
                                <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" />
                                {preview}
                            </p>
                        ) : null}

                        <FormField
                            control={form.control}
                            name="scope"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kapsam *</FormLabel>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={FACTORY_SCOPE}>Tüm fabrika</SelectItem>
                                            {areas.length > 0 ? (
                                                <>
                                                    <SelectSeparator />
                                                    <SelectGroup>
                                                        <SelectLabel>Alanlar</SelectLabel>
                                                        {areas.map((area) => (
                                                            <SelectItem key={area.id} value={`area:${area.id}`}>
                                                                {area.code} · {area.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </>
                                            ) : null}
                                            {machines.length > 0 ? (
                                                <>
                                                    <SelectSeparator />
                                                    <SelectGroup>
                                                        <SelectLabel>Makineler</SelectLabel>
                                                        {machines.map((machine) => (
                                                            <SelectItem key={machine.id} value={`machine:${machine.id}`}>
                                                                {machine.code} · {machine.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                </>
                                            ) : null}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                        Aynı gün için daha dar kapsam geçerlidir: fabrika tatilken bir alan ek mesai yapabilir.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Açıklama
                                        <OptionalFieldHint />
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="ör. Kurban Bayramı" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => onOpenChange(false)}
                                disabled={saveMutation.isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={saveMutation.isPending}>
                                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {saveMutation.isPending ? "Kaydediliyor" : "Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
