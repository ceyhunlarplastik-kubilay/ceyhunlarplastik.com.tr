"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { EntityAssignmentSelect } from "@/features/admin/users/components/EntityAssignmentSelect"
import type { Supplier } from "@/features/admin/suppliers/api/types"
import {
    buildSupplierUpdatePayload,
    supplierEditorSchema,
    toSupplierEditorFormValues,
    type SupplierEditorFormValues,
} from "@/features/admin/suppliers/schema/supplierEditor"

type AssignmentOption = {
    id: string
    label: string
    caption?: string
}

type Props = {
    open: boolean
    supplier: Supplier | null
    purchasingUserOptions: AssignmentOption[]
    isPending: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (payload: ReturnType<typeof buildSupplierUpdatePayload>) => Promise<void>
}

export function EditSupplierDialog({
    open,
    supplier,
    purchasingUserOptions,
    isPending,
    onOpenChange,
    onSubmit,
}: Props) {
    const form = useForm<SupplierEditorFormValues>({
        resolver: zodResolver(supplierEditorSchema),
        defaultValues: supplier ? toSupplierEditorFormValues(supplier) : undefined,
    })

    useEffect(() => {
        if (supplier && open) {
            form.reset(toSupplierEditorFormValues(supplier))
        }
    }, [form, open, supplier])

    if (!supplier) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>Tedarikçi Bilgileri</DialogTitle>
                </DialogHeader>

                <form
                    className="grid gap-3"
                    onSubmit={form.handleSubmit(async (values) => {
                        await onSubmit(buildSupplierUpdatePayload(supplier.id, values))
                    })}
                >
                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-name">Firma Adı</Label>
                        <Input id="supplier-name" placeholder="Firma Adı" {...form.register("name")} />
                        {form.formState.errors.name ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.name.message}</p>
                        ) : null}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-contact-name">Yetkili Adı</Label>
                        <Input id="supplier-contact-name" placeholder="Yetkili Adı" {...form.register("contactName")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-phone">Telefon</Label>
                        <Input id="supplier-phone" placeholder="Telefon" {...form.register("phone")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-tax-number">Vergi No</Label>
                        <Input id="supplier-tax-number" placeholder="Vergi No" {...form.register("taxNumber")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-address">Adres</Label>
                        <Input id="supplier-address" placeholder="Adres" {...form.register("address")} />
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-default-payment-term">Varsayılan Vade (Gün)</Label>
                        <Input
                            id="supplier-default-payment-term"
                            type="number"
                            min={0}
                            placeholder="Varsayılan Vade (Gün)"
                            {...form.register("defaultPaymentTermDays")}
                        />
                        {form.formState.errors.defaultPaymentTermDays ? (
                            <p className="text-xs text-rose-600">{form.formState.errors.defaultPaymentTermDays.message}</p>
                        ) : null}
                    </div>

                    <div className="grid gap-1.5">
                        <Label htmlFor="supplier-purchasing-user">Satın Alma Sorumluları</Label>
                        <Controller
                            control={form.control}
                            name="assignedPurchasingUserIds"
                            render={({ field }) => (
                                <EntityAssignmentSelect
                                    value={field.value}
                                    options={purchasingUserOptions}
                                    placeholder="Satın almacı seç"
                                    emptyLabel="Kullanıcı bulunamadı"
                                    onChange={field.onChange}
                                />
                            )}
                        />
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={isPending}>
                            {isPending ? "Kaydediliyor..." : "Kaydet"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
