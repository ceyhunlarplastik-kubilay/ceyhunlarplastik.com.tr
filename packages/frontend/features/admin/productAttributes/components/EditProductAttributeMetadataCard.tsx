"use client"

import { useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import { AlertTriangle, Loader2, Save, Settings2 } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    updateProductAttribute,
    type UpdateProductAttributeInput,
} from "@/features/admin/productAttributes/api/productAttributeApi"
import { getApiErrorMessage, mapApiErrorToFormErrors } from "@/features/admin/productAttributes/api/errorHelpers"
import { productAttributeKeys } from "@/features/admin/productAttributes/api/productAttributeKeys"
import { isSystemCustomerAttributeCode } from "@/features/admin/productAttributes/constants"
import {
    productAttributeMetadataSchema,
    type ProductAttributeMetadataFormValues,
} from "@/features/admin/productAttributes/schema/productAttributeMetadata"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"

type Props = {
    attribute: ProductAttribute
}

const metadataFormFields = ["name", "englishName", "code", "displayOrder", "isCustomerAssignable"] as const

export function EditProductAttributeMetadataCard({ attribute }: Props) {
    const queryClient = useQueryClient()
    const isSystemCustomerAttribute = isSystemCustomerAttributeCode(attribute.code)
    const englishTranslation = attribute.translations?.find((translation) => translation.locale === "en")

    const form = useForm<ProductAttributeMetadataFormValues>({
        resolver: zodResolver(productAttributeMetadataSchema),
        defaultValues: {
            name: attribute.name,
            englishName: englishTranslation?.name ?? "",
            code: attribute.code,
            displayOrder: attribute.displayOrder,
            isCustomerAssignable: isSystemCustomerAttribute || Boolean(attribute.isCustomerAssignable),
        },
        mode: "onChange",
    })

    useEffect(() => {
        form.reset({
            name: attribute.name,
            englishName: englishTranslation?.name ?? "",
            code: attribute.code,
            displayOrder: attribute.displayOrder,
            isCustomerAssignable: isSystemCustomerAttribute || Boolean(attribute.isCustomerAssignable),
        })
    }, [attribute, englishTranslation?.name, form, isSystemCustomerAttribute])

    const mutation = useMutation({
        mutationFn: async (
            values: ProductAttributeMetadataFormValues &
                Pick<UpdateProductAttributeInput, "translations" | "removeTranslationLocales">
        ) => {
            const { englishName: _englishName, ...payload } = values

            return updateProductAttribute(attribute.id, {
                ...payload,
                code: isSystemCustomerAttribute ? attribute.code : payload.code,
                isCustomerAssignable: isSystemCustomerAttribute ? true : payload.isCustomerAssignable,
            })
        },
        onSuccess: async (updatedAttribute) => {
            toast.success("Özellik ayarları güncellendi.")
            form.reset({
                name: updatedAttribute.name,
                englishName: updatedAttribute.translations?.find((translation) => translation.locale === "en")?.name ?? "",
                code: updatedAttribute.code,
                displayOrder: updatedAttribute.displayOrder,
                isCustomerAssignable: isSystemCustomerAttributeCode(updatedAttribute.code) ||
                    Boolean(updatedAttribute.isCustomerAssignable),
            })
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: productAttributeKeys.detail(attribute.id) }),
                queryClient.invalidateQueries({ queryKey: productAttributeKeys.withValues() }),
            ])
        },
        onError: (error) => {
            mapApiErrorToFormErrors(error, form.setError, metadataFormFields)
            toast.error(getApiErrorMessage(error, "Özellik ayarları güncellenemedi."))
        },
    })

    const canSave = form.formState.isDirty && form.formState.isValid && !mutation.isPending

    function handleSubmit(values: ProductAttributeMetadataFormValues) {
        if (isSystemCustomerAttribute && values.code !== attribute.code) {
            form.setError("code", {
                type: "manual",
                message: "Sistem müşteri profil alanının kodu değiştirilemez.",
            })
            return
        }

        const englishName = values.englishName?.trim() ?? ""

        mutation.mutate({
            ...values,
            englishName,
            ...(englishName
                ? { translations: [{ locale: "en", name: englishName }] }
                : englishTranslation
                    ? { removeTranslationLocales: ["en"] }
                    : {}),
        })
    }

    return (
        <section className="overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-neutral-100 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-700 shadow-sm">
                            <Settings2 className="h-4 w-4" />
                        </span>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                                Özellik Ayarları
                            </h2>
                            <p className="text-sm text-neutral-500">
                                Temel bilgileri ve müşteri profilindeki kullanılabilirliği yönetin.
                            </p>
                        </div>
                    </div>
                </div>

                {form.formState.isDirty ? (
                    <Badge variant="outline" className="w-fit border-amber-200 bg-amber-50 text-amber-800">
                        Kaydedilmemiş değişiklik
                    </Badge>
                ) : null}
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Özellik adı</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Örn. Sektör" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="englishName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>İngilizce ad</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="Ex. Sector" disabled={mutation.isPending} />
                                    </FormControl>
                                    <FormDescription>
                                        Boş bırakılırsa İngilizce çeviri kaydı kaldırılır.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kod</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            disabled={isSystemCustomerAttribute || mutation.isPending}
                                            placeholder="Örn. usage_area"
                                            className="font-mono"
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Küçük harf ve snake_case formatında olmalıdır.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="displayOrder"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sıralama</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={field.value}
                                            onChange={(event) => field.onChange(event.target.value === "" ? 0 : Number(event.target.value))}
                                            disabled={mutation.isPending}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {isSystemCustomerAttribute ? (
                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                                <div className="flex items-center gap-2 text-sm font-semibold text-amber-950">
                                    <AlertTriangle className="h-4 w-4" />
                                    Sistem müşteri profil alanı
                                </div>
                                <p className="mt-1 text-xs leading-5 text-amber-900/80">
                                    Bu özellik müşteri profilinde zorunlu sistem alanıdır. Kodu değiştirilemez ve müşteri profilinden kapatılamaz.
                                </p>
                            </div>
                        ) : (
                            <FormField
                                control={form.control}
                                name="isCustomerAssignable"
                                render={({ field }) => (
                                    <FormItem className="rounded-2xl border border-neutral-200 px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                                                    disabled={mutation.isPending}
                                                    className="mt-0.5"
                                                />
                                            </FormControl>
                                            <div className="space-y-1">
                                                <FormLabel className="text-sm font-medium text-neutral-900">
                                                    Müşteri profilinde kullanılabilir
                                                </FormLabel>
                                                <FormDescription className="text-xs">
                                                    Bu özellik müşteri profili seçim alanlarında kullanılabilir. Ürün kategori kısıtlarını değiştirmez.
                                                </FormDescription>
                                            </div>
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>

                    <Separator className="my-5" />

                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-xs leading-5 text-neutral-500">
                            Değişiklik yoksa kayıt butonu kapalı kalır. Sistem alanlarında korumalı değerler otomatik uygulanır.
                        </p>
                        <Button type="submit" disabled={!canSave} className="gap-2">
                            {mutation.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                            Kaydet
                        </Button>
                    </div>
                </form>
            </Form>
        </section>
    )
}
