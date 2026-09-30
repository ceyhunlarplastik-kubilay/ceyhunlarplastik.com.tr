"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
    REASON_KIND_LABELS,
    STOP_CATEGORIES,
    STOP_CATEGORY_LABELS,
    type ProductionReasonKind,
} from "@core/helpers/production/productionReasons"
import type { ProductionReason } from "@/features/production/reasons/api/types"
import { useCreateProductionReason, useUpdateProductionReason } from "@/features/production/reasons/hooks/useProductionReasons"
import {
    reasonFormDefaults,
    reasonFormSchema,
    toReasonInput,
    type ReasonFormInput,
    type ReasonFormOutput,
} from "@/features/production/reasons/schema/reasonForm"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    kind: ProductionReasonKind
    reason: ProductionReason | null
    nextSortOrder: number
}

/** Duruş / fire nedeni ekle-düzenle. Tür (sekme) değiştirilemez; duruşta kategori zorunlu. */
export function ProductionReasonFormDialog({ open, onOpenChange, kind, reason, nextSortOrder }: Props) {
    const createMutation = useCreateProductionReason()
    const updateMutation = useUpdateProductionReason()
    const form = useForm<ReasonFormInput, unknown, ReasonFormOutput>({
        resolver: zodResolver(reasonFormSchema(kind)),
        defaultValues: reasonFormDefaults(kind, reason, nextSortOrder),
    })

    useEffect(() => {
        if (open) form.reset(reasonFormDefaults(kind, reason, nextSortOrder))
    }, [open, kind, reason, nextSortOrder, form])

    async function submit(values: ReasonFormOutput) {
        const input = toReasonInput(kind, values)
        try {
            if (reason) {
                // Tür değiştirilemez; güncellemede gönderilmez.
                await updateMutation.mutateAsync({
                    id: reason.id,
                    input: { code: input.code, name: input.name, stopCategory: input.stopCategory, isActive: input.isActive, sortOrder: input.sortOrder },
                })
            } else {
                await createMutation.mutateAsync(input)
            }
            toast.success(`${input.code} · ${input.name} kaydedildi`)
            onOpenChange(false)
        } catch {
            // Hata mesajı (tekrar eden kod) global axios interceptor'ında gösteriliyor.
        }
    }

    const isPending = createMutation.isPending || updateMutation.isPending
    const label = REASON_KIND_LABELS[kind].toLocaleLowerCase("tr-TR")

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
                        <DialogHeader>
                            <DialogTitle>{reason ? `${reason.code} düzenle` : `Yeni ${label} nedeni`}</DialogTitle>
                            <DialogDescription>
                                Kod tür içinde tekildir (ör. {kind === "STOP" ? "D13" : "F11"}). Raporda kullanılan neden silinmez; pasife alınır.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-3 sm:grid-cols-[8rem_minmax(0,1fr)]">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kod</FormLabel>
                                        <FormControl><Input autoCapitalize="characters" maxLength={20} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ad</FormLabel>
                                        <FormControl><Input maxLength={80} {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {kind === "STOP" ? (
                            <FormField
                                control={form.control}
                                name="stopCategory"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kategori</FormLabel>
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl><SelectTrigger className="w-full"><SelectValue /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {STOP_CATEGORIES.map((category) => (
                                                    <SelectItem key={category} value={category}>{STOP_CATEGORY_LABELS[category]}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ) : null}
                        <div className="grid gap-3 sm:grid-cols-2">
                            <FormNumberField control={form.control} name="sortOrder" label="Sıra" required />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex items-center gap-2 self-end pb-2">
                                        <FormControl><Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} /></FormControl>
                                        <FormLabel className="!mt-0">Aktif (raporda seçilebilir)</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Vazgeç</Button>
                            <Button type="submit" disabled={isPending}>Kaydet</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
