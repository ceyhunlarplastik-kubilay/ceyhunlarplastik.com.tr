"use client"

import { useFormContext } from "react-hook-form"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { PortalRequestFormValues } from "@/features/customerPortal/components/requestComposer/schema"

export function CustomerPricingRequestFields() {
    const form = useFormContext<PortalRequestFormValues>()

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="referenceCode"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Teklif / Musteri Referansi</FormLabel>
                            <FormControl>
                                <Input placeholder="Opsiyonel teklif referansi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="pricingNeededAt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Fiyat Teyit Tarihi</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="pricingReason"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Talep Nedeni</FormLabel>
                            <FormControl>
                                <Input placeholder="Orn. enflasyon nedeniyle guncel fiyat teyidi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="pricingExpectation"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ticari Beklenti</FormLabel>
                            <FormControl>
                                <Input placeholder="Orn. yillik hacim icin revize teklif" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="commercialNote"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Ek Ticari Not</FormLabel>
                        <FormControl>
                            <Textarea
                                rows={4}
                                placeholder="Liste fiyatinin guncellik endisesi, hedef teklif yaklasimi veya siparis hacmi notunu yazin."
                                {...field}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
    )
}
