"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    buildBulkPricingPayload,
    supplierBulkPricingSchema,
    SUPPLIER_BULK_PRICING_DEFAULT_VALUES,
    type SupplierBulkPricingFormValues,
} from "@/features/admin/suppliers/schema/bulkPricing"

type Props = {
    visible: boolean
    isPending: boolean
    onSubmit: (payload: ReturnType<typeof buildBulkPricingPayload>) => Promise<void>
}

export function SupplierBulkPricingForm({
    visible,
    isPending,
    onSubmit,
}: Props) {
    const form = useForm<SupplierBulkPricingFormValues>({
        resolver: zodResolver(supplierBulkPricingSchema),
        defaultValues: SUPPLIER_BULK_PRICING_DEFAULT_VALUES,
    })

    if (!visible) return null

    return (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
            <div className="mb-2 text-sm font-medium text-neutral-800">
                Seçili modelde toplu oran güncelle
            </div>

            <form
                className="grid gap-2 md:grid-cols-4"
                onSubmit={form.handleSubmit(async (values) => {
                    await onSubmit(buildBulkPricingPayload(values))
                })}
            >
                <div className="space-y-1">
                    <Input
                        inputMode="decimal"
                        placeholder="Operasyonel Maliyet %"
                        {...form.register("operationalCostRate")}
                    />
                    {form.formState.errors.operationalCostRate ? (
                        <p className="text-xs text-rose-600">{form.formState.errors.operationalCostRate.message}</p>
                    ) : null}
                </div>

                <div className="space-y-1">
                    <Input
                        inputMode="decimal"
                        placeholder="Kâr Oranı %"
                        {...form.register("profitRate")}
                    />
                    {form.formState.errors.profitRate ? (
                        <p className="text-xs text-rose-600">{form.formState.errors.profitRate.message}</p>
                    ) : null}
                </div>

                <div className="md:col-span-2">
                    <Button className="w-full" type="submit" disabled={isPending}>
                        {isPending ? "Güncelleniyor..." : "Seçili Modelde Toplu Güncelle"}
                    </Button>
                </div>
            </form>
        </div>
    )
}
