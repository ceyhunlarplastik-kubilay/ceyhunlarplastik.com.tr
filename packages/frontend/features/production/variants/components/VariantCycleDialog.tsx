"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Save } from "lucide-react"
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
import { Form } from "@/components/ui/form"
import { FormNumberField } from "@/features/production/shared/components/FormNumberField"
import type { ProductionVariant } from "@/features/production/variants/api/types"
import { useSetProductionVariantCycle } from "@/features/production/variants/hooks/useProductionVariants"
import {
    createVariantCycleFormDefaults,
    variantCycleFormSchema,
    type VariantCycleFormInput,
    type VariantCycleFormValues,
} from "@/features/production/variants/schema/variantCycleForm"

type Props = {
    variant: ProductionVariant | null
    onOpenChange: (open: boolean) => void
}

/** Varyanta özel çevrim süresi: boş kaydedilirse kaldırılır. */
export function VariantCycleDialog({ variant, onOpenChange }: Props) {
    const mutation = useSetProductionVariantCycle()

    const form = useForm<VariantCycleFormInput, unknown, VariantCycleFormValues>({
        resolver: zodResolver(variantCycleFormSchema),
        defaultValues: createVariantCycleFormDefaults(),
    })

    useEffect(() => {
        if (!variant) return
        form.reset(createVariantCycleFormDefaults(variant))
    }, [form, variant])

    const handleSubmit = form.handleSubmit(async (values) => {
        if (!variant) return
        try {
            await mutation.mutateAsync({ variantId: variant.id, cycleTimeSec: values.cycleTimeSec })
            toast.success(
                values.cycleTimeSec === null
                    ? `${variant.fullCode} varyant çevrimi kaldırıldı`
                    : `${variant.fullCode} çevrimi ${values.cycleTimeSec.toLocaleString("tr-TR")} sn`,
            )
            onOpenChange(false)
        } catch {
            // Hata mesajı global axios interceptor'ında gösteriliyor; dialog açık kalır.
        }
    })

    return (
        <Dialog open={Boolean(variant)} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-3xl sm:max-w-md">
                <DialogHeader className="text-start">
                    <DialogTitle>Varyant Çevrim Süresi</DialogTitle>
                    <DialogDescription>
                        {variant ? <span className="font-medium text-foreground">{variant.fullCode} · {variant.product.name}. </span> : null}
                        Planlamada sıra: emirdeki elle çevrim, kalıbın makine kartı, bu değer, en son kalıbın standart çevrimi ×
                        hammadde katsayısı.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FormNumberField
                            control={form.control}
                            name="cycleTimeSec"
                            label="Çevrim"
                            unit="sn"
                            decimal
                            description="Boş bırakırsanız varyant çevrimi kaldırılır. Planlanmış işler değişmez; yeni planlar ve taşınan işler bu değeri kullanır."
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                className="rounded-2xl"
                                onClick={() => onOpenChange(false)}
                                disabled={mutation.isPending}
                            >
                                Vazgeç
                            </Button>
                            <Button type="submit" className="rounded-2xl" disabled={mutation.isPending}>
                                {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {mutation.isPending ? "Kaydediliyor" : "Kaydet"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
