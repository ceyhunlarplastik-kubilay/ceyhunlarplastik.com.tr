"use client"

import { CirclePlus } from "lucide-react"
import { useFormContext } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { PortalRequestFormValues, ShippingAddressOption } from "@/features/customerPortal/components/requestComposer/schema"

type Props = {
    shippingAddressOptions: ShippingAddressOption[]
    onOpenShippingDialog: () => void
}

export function CustomerOrderRequestFields({
    shippingAddressOptions,
    onOpenShippingDialog,
}: Props) {
    const form = useFormContext<PortalRequestFormValues>()

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="deliveryDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Talep Edilen Teslim Tarihi</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="shippingAddressId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Sevkiyat Adresi</FormLabel>
                            <Select value={field.value || "__none__"} onValueChange={(value) => field.onChange(value === "__none__" ? "" : value)}>
                                <FormControl>
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Sevkiyat adresi secin" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="__none__">Adres secmeden devam et</SelectItem>
                                    {shippingAddressOptions.map((address) => (
                                        <SelectItem key={address.id} value={address.id}>
                                            {address.label} • {address.city}{!address.isPersisted ? " • yeni" : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                <span>
                    Kayitli sevkiyat adresi yoksa veya bu siparis icin yeni bir adres kullanacaksaniz dialog uzerinden ekleyebilirsiniz.
                </span>
                <Button type="button" variant="outline" size="sm" onClick={onOpenShippingDialog}>
                    <CirclePlus className="mr-2 h-4 w-4" />
                    Yeni Sevkiyat Adresi
                </Button>
            </div>

            <FormField
                control={form.control}
                name="referenceCode"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Musteri Referansi / Siparis Kodu</FormLabel>
                        <FormControl>
                            <Input placeholder="Opsiyonel referans kodu" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
