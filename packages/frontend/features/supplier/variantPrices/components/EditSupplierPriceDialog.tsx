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
    profitRate: z.string().default(""),
    listPrice: z.string().default(""),
    minOrderQty: z.string().default(""),
    stockQty: z.string().default(""),
    currency: z.string().min(3).max(3),
})

type FormValues = z.infer<typeof formSchema>

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    row: SupplierVariantPrice | null
    endpointPrefix?: "supplier" | "purchasing"
    allowAdvancedFields?: boolean
}

function decimalLikeToString(value: number | string | { s?: number; e?: number; d?: number[] } | null | undefined) {
    if (value === null || value === undefined) return ""
    if (typeof value === "string" || typeof value === "number") return String(value)
    const sign = value.s === -1 ? "-" : ""
    const digits = Array.isArray(value.d) ? value.d.join("") : ""
    const exponent = typeof value.e === "number" ? value.e : digits.length - 1
    if (!digits) return ""
    if (exponent >= digits.length - 1) return `${sign}${digits}${"0".repeat(exponent - (digits.length - 1))}`
    if (exponent < 0) return `${sign}0.${"0".repeat(Math.abs(exponent) - 1)}${digits}`
    return `${sign}${digits.slice(0, exponent + 1)}.${digits.slice(exponent + 1)}`
}

export function EditSupplierPriceDialog({
    open,
    onOpenChange,
    row,
    endpointPrefix = "supplier",
    allowAdvancedFields = false,
}: Props) {
    const mutation = useUpdateSupplierVariantPrice(endpointPrefix)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            price: "",
            profitRate: "",
            listPrice: "",
            minOrderQty: "",
            stockQty: "",
            currency: "TRY",
        },
    })

    useEffect(() => {
        if (!open || !row) return
        form.reset({
            price: decimalLikeToString(row.price),
            profitRate: decimalLikeToString(row.profitRate),
            listPrice: decimalLikeToString(row.listPrice),
            minOrderQty: row.minOrderQty !== undefined && row.minOrderQty !== null ? String(row.minOrderQty) : "",
            stockQty: row.stockQty !== undefined && row.stockQty !== null ? String(row.stockQty) : "",
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

        const parsedProfitRate = allowAdvancedFields
            ? (values.profitRate?.trim() ? Number(values.profitRate.replace(",", ".")) : undefined)
            : undefined
        if (allowAdvancedFields && parsedProfitRate !== undefined && (!Number.isFinite(parsedProfitRate) || parsedProfitRate < 0)) {
            form.setError("profitRate", {
                type: "manual",
                message: "Kar oranı 0 veya pozitif sayı olmalıdır.",
            })
            return
        }

        const parsedListPrice = allowAdvancedFields
            ? (values.listPrice?.trim() ? Number(values.listPrice.replace(",", ".")) : undefined)
            : undefined
        if (allowAdvancedFields && parsedListPrice !== undefined && (!Number.isFinite(parsedListPrice) || parsedListPrice < 0)) {
            form.setError("listPrice", {
                type: "manual",
                message: "Liste fiyatı 0 veya pozitif sayı olmalıdır.",
            })
            return
        }

        const parsedMinOrderQty = values.minOrderQty?.trim()
            ? Number(values.minOrderQty.replace(",", "."))
            : undefined
        if (parsedMinOrderQty !== undefined && (!Number.isFinite(parsedMinOrderQty) || parsedMinOrderQty < 0 || !Number.isInteger(parsedMinOrderQty))) {
            form.setError("minOrderQty", {
                type: "manual",
                message: "Minimum sipariş adedi 0 veya pozitif tam sayı olmalıdır.",
            })
            return
        }

        const parsedStockQty = values.stockQty?.trim()
            ? Number(values.stockQty.replace(",", "."))
            : undefined
        if (parsedStockQty !== undefined && (!Number.isFinite(parsedStockQty) || parsedStockQty < 0 || !Number.isInteger(parsedStockQty))) {
            form.setError("stockQty", {
                type: "manual",
                message: "Stok adedi 0 veya pozitif tam sayı olmalıdır.",
            })
            return
        }

        await mutation.mutateAsync({
            id: row.id,
            price: parsedPrice,
            ...(allowAdvancedFields && parsedProfitRate !== undefined ? { profitRate: parsedProfitRate } : {}),
            ...(allowAdvancedFields && parsedListPrice !== undefined ? { listPrice: parsedListPrice } : {}),
            ...(parsedMinOrderQty !== undefined ? { minOrderQty: parsedMinOrderQty } : {}),
            ...(parsedStockQty !== undefined ? { stockQty: parsedStockQty } : {}),
            currency: values.currency.toUpperCase(),
            endpointPrefix,
        })

        onOpenChange(false)
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Tedarikçi Maliyet/Fiyatını Güncelle</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3 text-xs text-neutral-600">
                        <p className="font-mono text-neutral-800">{row?.variant?.fullCode ?? "-"}</p>
                        <p>{row?.variant?.name ?? "Varyant"}</p>
                    </div>

                    <div className="space-y-1">
                        <Label>Maliyet</Label>
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

                    {allowAdvancedFields && (
                        <div className="space-y-1">
                            <Label>Kar Oranı (%)</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="örn. 35"
                                {...form.register("profitRate")}
                            />
                            {form.formState.errors.profitRate && (
                                <p className="text-xs text-red-500">{form.formState.errors.profitRate.message}</p>
                            )}
                        </div>
                    )}

                    {allowAdvancedFields && (
                        <div className="space-y-1">
                            <Label>Liste Fiyatı</Label>
                            <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="örn. 4.18"
                                {...form.register("listPrice")}
                            />
                            {form.formState.errors.listPrice && (
                                <p className="text-xs text-red-500">{form.formState.errors.listPrice.message}</p>
                            )}
                        </div>
                    )}

                    <div className="space-y-1">
                        <Label>Minimum Sipariş Adedi</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="örn. 100"
                            {...form.register("minOrderQty")}
                        />
                        {form.formState.errors.minOrderQty && (
                            <p className="text-xs text-red-500">{form.formState.errors.minOrderQty.message}</p>
                        )}
                    </div>

                    <div className="space-y-1">
                        <Label>Stok Adedi</Label>
                        <Input
                            type="text"
                            inputMode="numeric"
                            placeholder="örn. 1200"
                            {...form.register("stockQty")}
                        />
                        {form.formState.errors.stockQty && (
                            <p className="text-xs text-red-500">{form.formState.errors.stockQty.message}</p>
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
