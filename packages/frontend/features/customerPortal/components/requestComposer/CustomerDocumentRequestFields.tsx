"use client"

import { useFormContext } from "react-hook-form"
import { Checkbox } from "@/components/ui/checkbox"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { documentTypeLabels, documentTypeValues, type PortalRequestFormValues } from "@/features/customerPortal/components/requestComposer/schema"

export function CustomerDocumentRequestFields() {
    const form = useFormContext<PortalRequestFormValues>()

    return (
        <div className="space-y-6">
            <div className="space-y-3">
                <div className="text-sm font-medium text-neutral-900">Istenen Dokuman Tipleri</div>
                <div className="grid gap-3 md:grid-cols-2">
                    {documentTypeValues.map((value) => {
                        const checked = form.watch("documentTypes").includes(value)
                        return (
                            <label key={value} className="flex items-start gap-3 rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                                <Checkbox
                                    checked={checked}
                                    onCheckedChange={(nextChecked) => {
                                        const current = form.getValues("documentTypes")
                                        form.setValue(
                                            "documentTypes",
                                            nextChecked
                                                ? [...current, value]
                                                : current.filter((item) => item !== value),
                                            { shouldValidate: true },
                                        )
                                    }}
                                />
                                <span>{documentTypeLabels[value]}</span>
                            </label>
                        )
                    })}
                </div>
                {form.formState.errors.documentTypes?.message ? (
                    <p className="text-sm text-red-600">{form.formState.errors.documentTypes.message}</p>
                ) : null}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="documentFormat"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Tercih Edilen Format</FormLabel>
                            <FormControl>
                                <Input placeholder="PDF, STEP, IGES, ZIP..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="documentNeededAt"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ihtiyac Tarihi</FormLabel>
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
                    name="documentProductReference"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Urun Model Referansi</FormLabel>
                            <FormControl>
                                <Input placeholder="Orn. 10.11 / Urun adi" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="documentVariantReference"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Varyant / Full Code</FormLabel>
                            <FormControl>
                                <Input placeholder="Orn. 10.11.B.V1" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <FormField
                control={form.control}
                name="documentPurpose"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Talep Amaci</FormLabel>
                        <FormControl>
                            <Textarea
                                rows={4}
                                placeholder="Orn. son musteri onayi, kalite dosyasi, teklif dosyasi veya teknik degerlendirme icin gerekli."
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
