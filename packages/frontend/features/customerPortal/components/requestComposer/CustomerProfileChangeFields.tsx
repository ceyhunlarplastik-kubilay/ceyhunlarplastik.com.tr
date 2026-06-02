"use client"

import type { FieldArrayWithId } from "react-hook-form"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { GeoAddressFields } from "@/features/geo/components/GeoAddressFields"
import { type AddressDraftFormValues, type PortalRequestFormValues } from "@/features/customerPortal/components/requestComposer/schema"

type Props = {
    addressFields: FieldArrayWithId<PortalRequestFormValues, "addresses", "id">[]
    appendAddress: () => void
    removeAddress: (index: number) => void
}

export function CustomerProfileChangeFields({
    addressFields,
    appendAddress,
    removeAddress,
}: Props) {
    const form = useFormContext<PortalRequestFormValues>()

    const getAddressFieldError = (index: number, key: keyof AddressDraftFormValues) => {
        const issue = form.formState.errors.addresses?.[index]?.[key]
        return issue?.message ? String(issue.message) : ""
    }

    const getAddressFieldClassName = (index: number, key: keyof AddressDraftFormValues) =>
        getAddressFieldError(index, key) ? "border-destructive focus-visible:ring-destructive/20" : ""

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="profileCompanyName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Firma Adi</FormLabel>
                            <FormControl>
                                <Input placeholder="Firma adi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="profileFullName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Yetkili Kisi</FormLabel>
                            <FormControl>
                                <Input placeholder="Yetkili kisi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="profileEmail"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-posta</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="iletisim@firma.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="profilePhone"
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
            </div>

            <FormField
                control={form.control}
                name="profileNote"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Profil Notu</FormLabel>
                        <FormControl>
                            <Textarea
                                rows={4}
                                placeholder="Firma bilgisi degisikligi, yeni fatura adresi veya iletisim degisikligi ile ilgili kisa aciklama birakin."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />

            <div className="space-y-4 rounded-3xl border border-neutral-200 bg-neutral-50/80 p-4 md:p-5">
                <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium text-neutral-900">Adres Degisiklik Talebi</div>
                    <Button type="button" variant="outline" onClick={appendAddress}>
                        Adres Ekle
                    </Button>
                </div>

                {addressFields.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-sm text-neutral-500">
                        Talebe eklenecek adres yoksa bu alani bos birakabilirsiniz.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {addressFields.map((field, index) => (
                            <div key={field.id} className="rounded-[24px] border border-neutral-200 bg-white p-4 md:p-5 shadow-sm">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div className="text-sm font-semibold text-neutral-900">
                                        {form.watch(`addresses.${index}.label`) || `Adres ${index + 1}`}
                                    </div>
                                    <Button type="button" size="sm" variant="ghost" onClick={() => removeAddress(index)}>
                                        Kaldir
                                    </Button>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="space-y-2">
                                        <FormLabel>Adres Etiketi</FormLabel>
                                        <Input
                                            {...form.register(`addresses.${index}.label`)}
                                            className={getAddressFieldClassName(index, "label")}
                                            placeholder="Merkez, Depo, Fatura..."
                                        />
                                        {getAddressFieldError(index, "label") ? <p className="text-sm text-destructive">{getAddressFieldError(index, "label")}</p> : null}
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Irtibat Kisisi</FormLabel>
                                        <Input {...form.register(`addresses.${index}.contactName`)} placeholder="Irtibat kisisi" />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Telefon</FormLabel>
                                        <Input {...form.register(`addresses.${index}.phone`)} placeholder="Telefon" />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>E-posta</FormLabel>
                                        <Input
                                            {...form.register(`addresses.${index}.email`)}
                                            className={getAddressFieldClassName(index, "email")}
                                            placeholder="E-posta"
                                        />
                                        {getAddressFieldError(index, "email") ? <p className="text-sm text-destructive">{getAddressFieldError(index, "email")}</p> : null}
                                    </div>
                                    <div className="md:col-span-2 xl:col-span-4 grid gap-4 xl:grid-cols-3">
                                        <GeoAddressFields
                                            countryId={form.watch(`addresses.${index}.countryId`) ?? null}
                                            stateId={form.watch(`addresses.${index}.stateId`) ?? null}
                                            cityId={form.watch(`addresses.${index}.cityId`) ?? null}
                                            onChange={(patch) => {
                                                if (patch.countryId !== undefined) form.setValue(`addresses.${index}.countryId`, patch.countryId ?? null)
                                                if (patch.stateId !== undefined) form.setValue(`addresses.${index}.stateId`, patch.stateId ?? null)
                                                if (patch.cityId !== undefined) form.setValue(`addresses.${index}.cityId`, patch.cityId ?? null)
                                                if (patch.country !== undefined) form.setValue(`addresses.${index}.country`, patch.country)
                                                if (patch.stateName !== undefined) form.setValue(`addresses.${index}.stateName`, patch.stateName)
                                                if (patch.city !== undefined) form.setValue(`addresses.${index}.city`, patch.city)
                                            }}
                                        />
                                        <div className="xl:col-span-3 grid gap-2 md:grid-cols-3">
                                            {getAddressFieldError(index, "countryId") ? <p className="text-sm text-destructive">{getAddressFieldError(index, "countryId")}</p> : <div />}
                                            {getAddressFieldError(index, "stateId") ? <p className="text-sm text-destructive">{getAddressFieldError(index, "stateId")}</p> : <div />}
                                            {getAddressFieldError(index, "cityId") ? <p className="text-sm text-destructive">{getAddressFieldError(index, "cityId")}</p> : <div />}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Mahalle / Bolge</FormLabel>
                                        <Input {...form.register(`addresses.${index}.district`)} placeholder="Mahalle, semt veya bolge" />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Posta Kodu</FormLabel>
                                        <Input {...form.register(`addresses.${index}.postalCode`)} placeholder="Posta kodu" />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Vergi Dairesi</FormLabel>
                                        <Input {...form.register(`addresses.${index}.taxOffice`)} placeholder="Vergi dairesi" />
                                    </div>
                                    <div className="space-y-2">
                                        <FormLabel>Vergi Numarasi</FormLabel>
                                        <Input {...form.register(`addresses.${index}.taxNumber`)} placeholder="VKN / TCKN" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                        <FormLabel>Acik Adres</FormLabel>
                                        <Input
                                            {...form.register(`addresses.${index}.line1`)}
                                            className={getAddressFieldClassName(index, "line1")}
                                            placeholder="Cadde, sokak, bina no, kat, daire"
                                        />
                                        {getAddressFieldError(index, "line1") ? <p className="text-sm text-destructive">{getAddressFieldError(index, "line1")}</p> : null}
                                    </div>
                                    <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                        <FormLabel>Adres Satiri 2</FormLabel>
                                        <Input {...form.register(`addresses.${index}.line2`)} placeholder="Opsiyonel ek adres bilgisi" />
                                    </div>
                                    <div className="space-y-2 md:col-span-2 xl:col-span-4">
                                        <FormLabel>Adres Notu</FormLabel>
                                        <Textarea {...form.register(`addresses.${index}.note`)} rows={3} placeholder="Adresle ilgili kisa aciklama" />
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-4 border-t border-neutral-100 pt-4">
                                    <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                                        <Checkbox
                                            checked={form.watch(`addresses.${index}.isPrimary`)}
                                            onCheckedChange={(checked) => form.setValue(`addresses.${index}.isPrimary`, Boolean(checked))}
                                        />
                                        Birincil
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                                        <Checkbox
                                            checked={form.watch(`addresses.${index}.isBilling`)}
                                            onCheckedChange={(checked) => form.setValue(`addresses.${index}.isBilling`, Boolean(checked))}
                                        />
                                        Fatura
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                                        <Checkbox
                                            checked={form.watch(`addresses.${index}.isShipping`)}
                                            onCheckedChange={(checked) => form.setValue(`addresses.${index}.isShipping`, Boolean(checked))}
                                        />
                                        Sevkiyat
                                    </label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
