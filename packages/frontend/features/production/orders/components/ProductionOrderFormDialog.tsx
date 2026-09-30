"use client"

import { useEffect } from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { CalendarDays, ClipboardList, Loader2, Package, Save, StickyNote } from "lucide-react"
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
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { formatProductionOrderNumber } from "@core/helpers/production/productionOrders"
import { DialogFormSection, OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionOrder } from "@/features/production/orders/api/types"
import {
    useCreateProductionOrder,
    useUpdateProductionOrder,
} from "@/features/production/orders/hooks/useProductionOrders"
import {
    buildProductionOrderPayload,
    createProductionOrderFormDefaults,
    productionOrderFormSchema,
    type ProductionOrderFormInput,
    type ProductionOrderFormValues,
} from "@/features/production/orders/schema/productionOrderForm"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"
import { PRIORITY_OPTIONS, SOURCE_OPTIONS } from "@/features/production/shared/orderStatus"
import { OrderCustomerField } from "./OrderCustomerField"
import { OrderVariantField } from "./OrderVariantField"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    order?: ProductionOrder | null
}

/** Üretim emri formu. Durum burada değil listede değişir (taslak / beklemede / iptal). */
export function ProductionOrderFormDialog({ open, onOpenChange, order }: Props) {
    const isEditing = Boolean(order)
    const createMutation = useCreateProductionOrder()
    const updateMutation = useUpdateProductionOrder()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<ProductionOrderFormInput, unknown, ProductionOrderFormValues>({
        resolver: zodResolver(productionOrderFormSchema),
        defaultValues: createProductionOrderFormDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createProductionOrderFormDefaults(order))
    }, [form, open, order])

    const source = useWatch({ control: form.control, name: "source" })

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildProductionOrderPayload(values)

        try {
            if (order) {
                await updateMutation.mutateAsync({ id: order.id, input: payload })
                toast.success(`${formatProductionOrderNumber(order.orderNumber)} güncellendi`)
            } else {
                const created = await createMutation.mutateAsync(payload)
                toast.success(`${formatProductionOrderNumber(created.orderNumber)} oluşturuldu`)
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
            <DialogContent className="flex max-h-[min(52rem,calc(100dvh-2rem))] flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-[min(48rem,calc(100vw-3rem))]">
                <DialogHeader className="shrink-0 gap-1.5 border-b px-5 py-4 pe-12 text-start sm:px-6 sm:pe-12">
                    <DialogTitle className="text-lg font-semibold tracking-tight">
                        {order ? `${formatProductionOrderNumber(order.orderNumber)} · Emri Düzenle` : "Yeni Üretim Emri"}
                    </DialogTitle>
                    <DialogDescription>
                        Hangi varyanttan kaç sağlam adet, hangi termine kadar. Emir taslak açılır; planlama (makine, zaman,
                        lotlar) sonraki adımda.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                            <div className="divide-y px-4 sm:px-6">
                                <DialogFormSection icon={<Package />} title="Ürün">
                                    <OrderVariantField />
                                </DialogFormSection>

                                <DialogFormSection icon={<CalendarDays />} title="Miktar ve Termin" tone="sky">
                                    <div className="grid items-start gap-4 sm:grid-cols-3">
                                        <FormNumberField
                                            control={form.control}
                                            name="quantity"
                                            label="Adet"
                                            required
                                            description="Hedef SAĞLAM adet; fire planlamada eklenir."
                                        />
                                        <FormField
                                            control={form.control}
                                            name="dueDate"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        Termin
                                                        <OptionalFieldHint />
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input type="date" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="priority"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Öncelik</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {PRIORITY_OPTIONS.map((option) => (
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
                                </DialogFormSection>

                                <DialogFormSection icon={<ClipboardList />} title="Kaynak" tone="emerald">
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <FormField
                                            control={form.control}
                                            name="source"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Emrin kaynağı</FormLabel>
                                                    <Select value={field.value} onValueChange={field.onChange}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {SOURCE_OPTIONS.map((option) => (
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
                                        <OrderCustomerField required={source === "CUSTOMER_ORDER"} />
                                    </div>
                                </DialogFormSection>

                                <DialogFormSection icon={<StickyNote />} title="Planlama Notları">
                                    <div className="grid gap-4 sm:grid-cols-[12rem_minmax(0,1fr)]">
                                        <FormNumberField
                                            control={form.control}
                                            name="cycleTimeOverrideSec"
                                            label="Elle çevrim"
                                            unit="sn"
                                            decimal
                                            description="Boşsa kalıp / makine kartı ve hammadde katsayısı."
                                        />
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
                                                        <Textarea rows={3} placeholder="ör. Siyah boyadan önce gri bitirilsin" {...field} />
                                                    </FormControl>
                                                    <FormDescription className="text-xs">Emrin iç notu; müşteri görmez.</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </DialogFormSection>
                            </div>
                        </div>

                        <DialogFooter className="shrink-0 border-t bg-background px-4 py-3 sm:px-6">
                            <Button type="button" variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={isPending}>
                                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isPending ? "Kaydediliyor" : isEditing ? "Değişiklikleri Kaydet" : "Emri Oluştur"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
