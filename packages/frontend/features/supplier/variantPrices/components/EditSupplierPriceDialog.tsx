"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { SupplierVariantPrice } from "@/features/supplier/variantPrices/api/types"
import { useUpdateSupplierVariantPrice } from "@/features/supplier/variantPrices/hooks/useUpdateSupplierVariantPrice"

const formSchema = z.object({
    price: z.string().min(1, "Fiyat zorunludur"),
    currency: z.string().min(3).max(3),
})

type FormValues = z.infer<typeof formSchema>

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    row: SupplierVariantPrice | null
}

export function EditSupplierPriceDialog({ open, onOpenChange, row }: Props) {
    const mutation = useUpdateSupplierVariantPrice()

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            price: "",
            currency: "TRY",
        },
    })

    useEffect(() => {
        if (!open || !row) return
        form.reset({
            price: String(row.price ?? ""),
            currency: row.currency ?? "TRY",
        })
    }, [form, open, row])

    const onSubmit = form.handleSubmit(async (values) => {
        if (!row) return

        const parsedPrice = Number(values.price.replace(",", "."))
        if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
            form.setError("price", {
                type: "manual",
                message: "Fiyat 0 veya pozitif sayı olmalıdır.",
            })
            return
        }

        await mutation.mutateAsync({
            id: row.id,
            price: parsedPrice,
            currency: values.currency.toUpperCase(),
        })

        onOpenChange(false)
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tedarikçi Fiyatını Güncelle</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                        <p className="font-mono text-neutral-800">{row?.variant?.fullCode ?? "-"}</p>
                        <p>{row?.variant?.name ?? "Varyant"}</p>
                    </div>

                    <div className="space-y-1">
                        <Label>Fiyat</Label>
                        <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="örn. 3.10"
                            {...form.register("price")}
                        />
                        {form.formState.errors.price && (
                            <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Para Birimi</Label>
                        <select
                            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                            {...form.register("currency")}
                        >
                            <option value="TRY">TRY</option>
                            <option value="USD">USD</option>
                            <option value="EUR">EUR</option>
                        </select>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={mutation.isPending}
                        >
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={mutation.isPending}>
                            {mutation.isPending ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
