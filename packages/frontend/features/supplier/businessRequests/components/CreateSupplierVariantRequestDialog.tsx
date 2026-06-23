"use client"

import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { EntityAssignmentSelect } from "@/features/admin/users/components/EntityAssignmentSelect"
import { useCreateSupplierBusinessRequest } from "@/features/supplier/businessRequests/hooks/useCreateSupplierBusinessRequest"
import { useSupplierVariantRequestReferences } from "@/features/supplier/businessRequests/hooks/useSupplierVariantRequestReferences"

const schema = z.object({
    name: z.string().min(1, "Varyant adı zorunlu"),
    versionCode: z.string().regex(/^V[0-9]+$/, "Versiyon kodu V1 formatında olmalı"),
    supplierCode: z.string().regex(/^[A-Z]$/, "Tedarikçi kodu tek büyük harf olmalı"),
    variantIndex: z.coerce.number().int().min(1, "Varyant indeksi zorunlu"),
    colorId: z.string().optional(),
    materialIds: z.array(z.string()).default([]),
    price: z.string().optional(),
    paymentTermDays: z.string().optional(),
    supplierVariantCode: z.string().optional(),
    supplierNote: z.string().optional(),
    minOrderQty: z.string().optional(),
    stockQty: z.string().optional(),
    currency: z.string().min(3).max(3),
    measurements: z.array(z.object({
        measurementTypeId: z.string().min(1, "Ölçü tipi zorunlu"),
        value: z.string().min(1, "Değer zorunlu"),
        label: z.string().optional(),
    })).default([]),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    productId: string
    productCode: string
    productName: string
}

function parseNumber(value?: string) {
    if (!value?.trim()) return undefined
    const parsed = Number(value.replace(",", "."))
    return Number.isFinite(parsed) ? parsed : undefined
}

export function CreateSupplierVariantRequestDialog({
    open,
    onOpenChange,
    productId,
    productCode,
    productName,
}: Props) {
    const mutation = useCreateSupplierBusinessRequest("Varyant talebi onaya gönderildi")
    const refsQuery = useSupplierVariantRequestReferences(open)
    const form = useForm<FormInput, unknown, FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            name: "",
            versionCode: "V1",
            supplierCode: "A",
            variantIndex: 1,
            colorId: "",
            materialIds: [],
            price: "",
            paymentTermDays: "",
            supplierVariantCode: "",
            supplierNote: "",
            minOrderQty: "",
            stockQty: "",
            currency: "TRY",
            measurements: [],
        },
    })
    const measurementFields = useFieldArray({
        control: form.control,
        name: "measurements",
    })
    const colorId = useWatch({
        control: form.control,
        name: "colorId",
    })
    const measurements = useWatch({
        control: form.control,
        name: "measurements",
    })
    const materialIds = useWatch({
        control: form.control,
        name: "materialIds",
    })

    const onSubmit = form.handleSubmit(async (values) => {
        await mutation.mutateAsync({
            type: "SUPPLIER_VARIANT_CREATE",
            title: `${productCode} · ${values.name}`,
            description: values.supplierNote?.trim() || null,
            requestedData: {
                productId,
                productCode,
                productName,
                name: values.name.trim(),
                versionCode: values.versionCode.trim(),
                supplierCode: values.supplierCode.trim().toUpperCase(),
                variantIndex: values.variantIndex,
                colorId: values.colorId || undefined,
                materialIds: values.materialIds,
                price: parseNumber(values.price),
                paymentTermDays: parseNumber(values.paymentTermDays),
                supplierVariantCode: values.supplierVariantCode?.trim() || undefined,
                supplierNote: values.supplierNote?.trim() || undefined,
                minOrderQty: parseNumber(values.minOrderQty),
                stockQty: parseNumber(values.stockQty),
                currency: values.currency.toUpperCase(),
                measurements: values.measurements.map((measurement) => ({
                    measurementTypeId: measurement.measurementTypeId,
                    value: Number(measurement.value.replace(",", ".")),
                    label: measurement.label?.trim() || measurement.value,
                })),
            },
        })

        onOpenChange(false)
        form.reset()
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Varyant Oluşturma Talebi</DialogTitle>
                </DialogHeader>

                <form onSubmit={onSubmit} className="space-y-5">
                    <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                        <div className="font-medium text-neutral-900">{productName}</div>
                        <div>{productCode}</div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <div className="space-y-1.5">
                            <Label>Varyant Adı</Label>
                            <Input {...form.register("name")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Versiyon Kodu</Label>
                            <Input {...form.register("versionCode")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tedarikçi Kodu</Label>
                            <Input maxLength={1} {...form.register("supplierCode")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Varyant İndeksi</Label>
                            <Input type="number" {...form.register("variantIndex")} />
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-1.5">
                            <Label>Renk</Label>
                            <Select value={colorId || "__none__"} onValueChange={(value) => form.setValue("colorId", value === "__none__" ? "" : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Renk seçin" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__none__">Renk yok</SelectItem>
                                    {(refsQuery.data?.colors ?? []).map((color) => (
                                        <SelectItem key={color.id} value={color.id}>
                                            {color.system ? `${color.system} · ` : ""}{color.code} · {color.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Malzemeler</Label>
                            <EntityAssignmentSelect
                                value={materialIds ?? []}
                                options={(refsQuery.data?.materials ?? []).map((material) => ({
                                    id: material.id,
                                    label: material.name,
                                }))}
                                placeholder="Malzeme seçin"
                                emptyLabel="Malzeme bulunamadı"
                                onChange={(value) => form.setValue("materialIds", value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Ölçüler</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => measurementFields.append({ measurementTypeId: "", value: "", label: "" })}>
                                Ölçü Ekle
                            </Button>
                        </div>

                        {measurementFields.fields.map((field, index) => (
                            <div key={field.id} className="grid gap-3 rounded-2xl border border-neutral-200 p-3 md:grid-cols-[1.1fr_0.9fr_1fr_auto]">
                                <Select
                                    value={measurements?.[index]?.measurementTypeId ?? ""}
                                    onValueChange={(value) => form.setValue(`measurements.${index}.measurementTypeId`, value, { shouldValidate: true })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Ölçü tipi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {(refsQuery.data?.measurementTypes ?? []).map((measurementType) => (
                                            <SelectItem key={measurementType.id} value={measurementType.id}>
                                                {measurementType.code} · {measurementType.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Input placeholder="Değer" {...form.register(`measurements.${index}.value`)} />
                                <Input placeholder="Etiket" {...form.register(`measurements.${index}.label`)} />
                                <Button type="button" variant="ghost" size="sm" onClick={() => measurementFields.remove(index)}>
                                    Sil
                                </Button>
                            </div>
                        ))}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-1.5">
                            <Label>Fiyat</Label>
                            <Input inputMode="decimal" {...form.register("price")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Vade (gün)</Label>
                            <Input inputMode="numeric" {...form.register("paymentTermDays")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Para Birimi</Label>
                            <Input maxLength={3} {...form.register("currency")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Tedarikçi Varyant Kodu</Label>
                            <Input {...form.register("supplierVariantCode")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Minimum Sipariş</Label>
                            <Input inputMode="numeric" {...form.register("minOrderQty")} />
                        </div>
                        <div className="space-y-1.5">
                            <Label>Stok</Label>
                            <Input inputMode="numeric" {...form.register("stockQty")} />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <Label>Not</Label>
                        <Textarea rows={4} {...form.register("supplierNote")} />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={mutation.isPending || refsQuery.isLoading}>
                            {mutation.isPending ? "Gönderiliyor..." : "Talep Aç"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
