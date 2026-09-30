"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionArea } from "@/features/production/areas/api/types"
import { useCreateProductionArea, useUpdateProductionArea } from "@/features/production/areas/hooks/useProductionAreas"
import {
    buildProductionAreaPayload,
    createProductionAreaFormDefaults,
    productionAreaFormSchema,
    type ProductionAreaFormInput,
    type ProductionAreaFormValues,
} from "@/features/production/areas/schema/productionAreaForm"
import { useShiftPatterns } from "@/features/production/shiftPatterns/hooks/useShiftPatterns"

/** Radix Select boş değer kabul etmiyor; "varsayılan düzen" bu sentinel ile seçilir. */
const DEFAULT_PATTERN_VALUE = "__default__"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    area?: ProductionArea | null
}

export function ProductionAreaFormDialog({ open, onOpenChange, area }: Props) {
    const isEditing = Boolean(area)
    const shiftPatternsQuery = useShiftPatterns()
    const createMutation = useCreateProductionArea()
    const updateMutation = useUpdateProductionArea()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<ProductionAreaFormInput, unknown, ProductionAreaFormValues>({
        resolver: zodResolver(productionAreaFormSchema),
        defaultValues: createProductionAreaFormDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createProductionAreaFormDefaults(area))
    }, [area, form, open])

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildProductionAreaPayload(values)

        try {
            if (area) {
                await updateMutation.mutateAsync({ id: area.id, input: payload })
                toast.success("Alan güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Alan oluşturuldu")
            }
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    }, () => {
        toast.error("Formda eksik veya hatalı alanlar var")
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-lg">
                <DialogHeader className="text-start">
                    <DialogTitle>{isEditing ? "Alanı Düzenle" : "Yeni Parkur / Alan"}</DialogTitle>
                    <DialogDescription>
                        Makineler bir alanda durur; planlama tahtasında satırlar alanlara göre gruplanır.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-[8rem_minmax(0,1fr)]">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kod *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="P1" className="uppercase" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ad *</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Parkur 1" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="shiftPatternId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Vardiya düzeni</FormLabel>
                                    <Select
                                        value={field.value || DEFAULT_PATTERN_VALUE}
                                        onValueChange={(value) => field.onChange(value === DEFAULT_PATTERN_VALUE ? "" : value)}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={DEFAULT_PATTERN_VALUE}>Varsayılan düzen</SelectItem>
                                            {(shiftPatternsQuery.data ?? []).map((pattern) => (
                                                <SelectItem key={pattern.id} value={pattern.id}>
                                                    {pattern.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription className="text-xs">
                                        Alandaki makineler kendi düzenlerini seçmediyse bunu kullanır.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="sortOrder"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Sıra</FormLabel>
                                        <FormControl>
                                            <Input inputMode="numeric" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isActive"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center gap-3 rounded-xl border p-3 sm:mt-6">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={(checked) => field.onChange(checked === true)}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-normal">Aktif</FormLabel>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="notes"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Not
                                        <OptionalFieldHint />
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={isPending}>
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
