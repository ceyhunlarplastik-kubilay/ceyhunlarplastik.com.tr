"use client"

import { useEffect, type ReactNode } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GeoAddressFields } from "@/features/geo/components/GeoAddressFields"
import type { AddressDraftFormValues } from "@/features/customerPortal/components/requestComposer/schema"
import { addressDraftSchema, emptyAddress } from "@/features/customerPortal/components/requestComposer/schema"
import { CustomerLocationPicker } from "@/features/customerLocations/components/CustomerLocationPicker"

const addressLocationSchema = addressDraftSchema.superRefine((address, ctx) => {
    if (!address.label.trim()) ctx.addIssue({ code: "custom", message: "Adres etiketi gerekli.", path: ["label"] })
    if (!address.countryId) ctx.addIssue({ code: "custom", message: "Ülke seçin.", path: ["countryId"] })
    if (!address.stateId) ctx.addIssue({ code: "custom", message: "İl seçin.", path: ["stateId"] })
    if (!address.cityId || !address.city.trim()) ctx.addIssue({ code: "custom", message: "İlçe seçin.", path: ["cityId"] })
    if (!address.line1.trim()) ctx.addIssue({ code: "custom", message: "Açık adres gerekli.", path: ["line1"] })
    if (address.latitude == null || address.longitude == null) {
        ctx.addIssue({ code: "custom", message: "Haritadan konum seçin.", path: ["latitude"] })
    }
})

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSubmit: (address: AddressDraftFormValues) => Promise<void> | void
    onDelete?: () => Promise<void> | void
    initialValues?: AddressDraftFormValues | null
    isSubmitting?: boolean
    isDeleting?: boolean
    title: string
    description: string
    submitLabel?: string
    deleteLabel?: string
}

function RequiredFormLabel({ children }: { children: ReactNode }) {
    return (
        <FormLabel>
            {children}
            <span className="ml-1 text-red-500" aria-hidden="true">*</span>
        </FormLabel>
    )
}

export function CustomerAddressFormDialog({
    open,
    onOpenChange,
    onSubmit,
    onDelete,
    initialValues,
    isSubmitting = false,
    isDeleting = false,
    title,
    description,
    submitLabel = "Kaydet",
    deleteLabel = "Sil",
}: Props) {
    const form = useForm<AddressDraftFormValues>({
        resolver: zodResolver(addressLocationSchema),
        defaultValues: initialValues ?? emptyAddress(),
    })
    const countryId = useWatch({ control: form.control, name: "countryId" })
    const stateId = useWatch({ control: form.control, name: "stateId" })
    const cityId = useWatch({ control: form.control, name: "cityId" })
    const latitude = useWatch({ control: form.control, name: "latitude" })
    const longitude = useWatch({ control: form.control, name: "longitude" })
    const geocodingLabel = useWatch({ control: form.control, name: "geocodingLabel" })
    const line1 = useWatch({ control: form.control, name: "line1" })
    const city = useWatch({ control: form.control, name: "city" })

    useEffect(() => {
        if (!open) {
            form.reset(initialValues ?? emptyAddress())
            return
        }

        form.reset(initialValues ?? emptyAddress())
    }, [form, initialValues, open])

    function applyPatch(patch: Partial<AddressDraftFormValues>) {
        for (const [key, value] of Object.entries(patch) as Array<[keyof AddressDraftFormValues, AddressDraftFormValues[keyof AddressDraftFormValues]]>) {
            form.setValue(key, value as never, {
                shouldDirty: true,
                shouldTouch: true,
                shouldValidate: true,
            })
        }
    }

    async function handleDelete() {
        if (!onDelete) return

        const addressLabel = form.getValues("label")?.trim() || initialValues?.label?.trim() || "Bu adres"
        const confirmed = window.confirm(`"${addressLabel}" adresini kalici olarak silmek istediginize emin misiniz?`)

        if (!confirmed) return
        await onDelete()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-5"
                        onSubmit={form.handleSubmit(async (values) => {
                            await onSubmit(values)
                        })}
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="label"
                                render={({ field }) => (
                                    <FormItem>
                                        <RequiredFormLabel>Adres Etiketi</RequiredFormLabel>
                                        <FormControl>
                                            <Input placeholder="Merkez depo, fatura adresi..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>İrtibat Kişisi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Teslimat veya muhasebe sorumlusu" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefon</FormLabel>
                                        <FormControl>
                                            <Input placeholder="+90 ..." {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-posta</FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="depo@firma.com" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <CustomerLocationPicker
                            value={{ latitude, longitude, geocodingLabel, line1, city }}
                            onChange={applyPatch}
                        />

                        <GeoAddressFields
                            countryId={countryId ?? null}
                            stateId={stateId ?? null}
                            cityId={cityId ?? null}
                            showRequiredIndicators
                            onChange={(patch) => {
                                if (patch.countryId !== undefined) form.setValue("countryId", patch.countryId ?? null)
                                if (patch.stateId !== undefined) form.setValue("stateId", patch.stateId ?? null)
                                if (patch.cityId !== undefined) form.setValue("cityId", patch.cityId ?? null)
                                if (patch.country !== undefined) form.setValue("country", patch.country)
                                if (patch.stateName !== undefined) form.setValue("stateName", patch.stateName)
                                if (patch.city !== undefined) form.setValue("city", patch.city)
                            }}
                        />

                        <div className="grid gap-4 md:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Mahalle / Bölge</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mahalle veya bölge" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="postalCode"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Posta Kodu</FormLabel>
                                        <FormControl>
                                            <Input placeholder="34000" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="taxNumber"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vergi No</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opsiyonel" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="line1"
                            render={({ field }) => (
                                <FormItem>
                                    <RequiredFormLabel>Açık Adres</RequiredFormLabel>
                                    <FormControl>
                                        <Textarea rows={3} placeholder="Cadde, sokak, bina, kat, daire..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="line2"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Ek Adres Bilgisi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opsiyonel" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="taxOffice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Vergi Dairesi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Opsiyonel" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Not</FormLabel>
                                    <FormControl>
                                        <Textarea rows={2} placeholder="Adresle ilgili kısa açıklama" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-3 sm:grid-cols-3">
                            {([
                                ["isPrimary", "Birincil adres"],
                                ["isBilling", "Fatura adresi"],
                                ["isShipping", "Sevkiyat adresi"],
                            ] as const).map(([name, label]) => (
                                <FormField
                                    key={name}
                                    control={form.control}
                                    name={name}
                                    render={({ field }) => (
                                        <FormItem className="flex items-center gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
                                            <FormControl>
                                                <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(Boolean(checked))} />
                                            </FormControl>
                                            <FormLabel className="m-0 text-sm font-medium">{label}</FormLabel>
                                        </FormItem>
                                    )}
                                />
                            ))}
                        </div>

                        <div className="flex items-center justify-between gap-2">
                            <div>
                                {onDelete ? (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() => void handleDelete()}
                                        disabled={isSubmitting || isDeleting}
                                    >
                                        {deleteLabel}
                                    </Button>
                                ) : null}
                            </div>

                            <div className="flex justify-end gap-2">
                                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                                    Vazgeç
                                </Button>
                                <Button type="submit" disabled={isSubmitting || isDeleting}>
                                    {submitLabel}
                                </Button>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
