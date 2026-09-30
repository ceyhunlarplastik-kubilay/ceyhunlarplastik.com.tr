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
import { Textarea } from "@/components/ui/textarea"
import { OptionalFieldHint } from "@/features/admin/shared/components/DialogFormSection"
import type { ProductionOperator } from "@/features/production/operators/api/types"
import {
    useCreateProductionOperator,
    useUpdateProductionOperator,
} from "@/features/production/operators/hooks/useProductionOperators"
import {
    buildProductionOperatorPayload,
    createProductionOperatorFormDefaults,
    productionOperatorFormSchema,
    type ProductionOperatorFormValues,
} from "@/features/production/operators/schema/productionOperatorForm"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    operator?: ProductionOperator | null
}

export function ProductionOperatorFormDialog({ open, onOpenChange, operator }: Props) {
    const isEditing = Boolean(operator)
    const createMutation = useCreateProductionOperator()
    const updateMutation = useUpdateProductionOperator()
    const isPending = createMutation.isPending || updateMutation.isPending

    const form = useForm<ProductionOperatorFormValues>({
        resolver: zodResolver(productionOperatorFormSchema),
        defaultValues: createProductionOperatorFormDefaults(),
    })

    useEffect(() => {
        if (!open) return
        form.reset(createProductionOperatorFormDefaults(operator))
    }, [form, open, operator])

    const handleSubmit = form.handleSubmit(async (values) => {
        const payload = buildProductionOperatorPayload(values)

        try {
            if (operator) {
                await updateMutation.mutateAsync({ id: operator.id, input: payload })
                toast.success("Operatör güncellendi")
            } else {
                await createMutation.mutateAsync(payload)
                toast.success("Operatör eklendi")
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
                    <DialogTitle>{isEditing ? "Operatörü Düzenle" : "Yeni Operatör"}</DialogTitle>
                    <DialogDescription>
                        Makine başında çalışan personel. Bu aşamada giriş hesabı yok; notları üretim planlayıcısı yazar.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ad *</FormLabel>
                                        <FormControl>
                                            <Input autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Soyad *</FormLabel>
                                        <FormControl>
                                            <Input autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="employeeNo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Sicil no
                                            <OptionalFieldHint />
                                        </FormLabel>
                                        <FormControl>
                                            <Input className="uppercase" autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormDescription className="text-xs">Tekil; aynı numara iki kişide olamaz.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Telefon
                                            <OptionalFieldHint />
                                        </FormLabel>
                                        <FormControl>
                                            <Input type="tel" inputMode="tel" autoComplete="off" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start gap-3 rounded-xl border p-3">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value}
                                            onCheckedChange={(checked) => field.onChange(checked === true)}
                                        />
                                    </FormControl>
                                    <div className="space-y-1">
                                        <FormLabel className="font-normal">Aktif</FormLabel>
                                        <FormDescription className="text-xs">
                                            İşten ayrılan personeli silmek yerine pasif yapın; geçmiş kayıtlarda adı kalır.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
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
                                        <Textarea rows={2} placeholder="ör. Robot ayarı yapabilir, gece vardiyasını tercih ediyor" {...field} />
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
