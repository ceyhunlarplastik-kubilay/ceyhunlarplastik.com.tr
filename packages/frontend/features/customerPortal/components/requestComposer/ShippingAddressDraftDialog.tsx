"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
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
import { addressDraftSchema, emptyAddress } from "@/features/customerPortal/components/requestComposer/schema"

export function ShippingAddressDraftDialog({
    open,
    onOpenChange,
    onSave,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSave: (address: z.infer<typeof addressDraftSchema>) => void
}) {
    const form = useForm<z.infer<typeof addressDraftSchema>>({
        resolver: zodResolver(addressDraftSchema.superRefine((address, ctx) => {
            if (!address.label.trim()) ctx.addIssue({ code: "custom", message: "Adres etiketi gerekli.", path: ["label"] })
            if (!address.countryId) ctx.addIssue({ code: "custom", message: "Ulke secin.", path: ["countryId"] })
            if (!address.stateId) ctx.addIssue({ code: "custom", message: "Il secin.", path: ["stateId"] })
            if (!address.cityId || !address.city.trim()) ctx.addIssue({ code: "custom", message: "Ilce secin.", path: ["cityId"] })
            if (!address.line1.trim()) ctx.addIssue({ code: "custom", message: "Acik adres gerekli.", path: ["line1"] })
        })),
        defaultValues: emptyAddress(),
    })

    useEffect(() => {
        if (!open) form.reset(emptyAddress())
    }, [form, open])

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Yeni Sevkiyat Adresi</DialogTitle>
                    <DialogDescription>
                        Bu adres mevcut siparis talebine eklenir. Gerekirse daha sonra profil akisindan kalici hale getirilebilir.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form
                        className="space-y-5"
                        onSubmit={form.handleSubmit((values) => {
                            onSave(values)
                            onOpenChange(false)
                        })}
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="label"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Adres Etiketi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Merkez depo, yeni fabrika..." {...field} />
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
                                        <FormLabel>Irtibat Kisisi</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Teslimat sorumlusu" {...field} />
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

                        <GeoAddressFields
                            countryId={form.watch("countryId") ?? null}
                            stateId={form.watch("stateId") ?? null}
                            cityId={form.watch("cityId") ?? null}
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
                                        <FormLabel>Mahalle / Bolge</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Mahalle veya bolge" {...field} />
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
                                    <FormLabel>Acik Adres</FormLabel>
                                    <FormControl>
                                        <Textarea rows={3} placeholder="Cadde, sokak, bina, kat, daire..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="flex items-center justify-end gap-3">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                                Vazgec
                            </Button>
                            <Button type="submit">
                                Adresi Siparise Ekle
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
