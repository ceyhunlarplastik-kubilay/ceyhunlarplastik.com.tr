"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { Check, Loader2, X } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    productAttributeValueEditSchema,
    type ProductAttributeValueEditFormValues,
} from "@/features/admin/productAttributes/schema/productAttributeValueForms"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"
import { AdminTranslatedNameSection } from "@/features/admin/shared/translations/AdminTranslatedNameSection"
import {
    ADMIN_DEFAULT_LOCALE,
    type AdminLocale,
} from "@/features/admin/shared/translations/adminLocales"
import {
    buildNameTranslationDefaults,
    type NameTranslationFormValues,
} from "@/features/admin/shared/translations/nameTranslations"

type Props = {
    value: ProductAttributeValue
    parentAttributeCode: string | null
    parentLabel: string
    parentValues: ProductAttributeValue[]
    isPending: boolean
    onCancel: () => void
    onSave: (input: {
        id: string
        name: string
        translations?: NameTranslationFormValues[]
        parentValueId?: string
    }) => Promise<void>
}

export function ProductAttributeValueEditForm({
    value,
    parentAttributeCode,
    parentLabel,
    parentValues,
    isPending,
    onCancel,
    onSave,
}: Props) {
    const [activeLocale, setActiveLocale] = useState<AdminLocale>(ADMIN_DEFAULT_LOCALE)
    const form = useForm<ProductAttributeValueEditFormValues>({
        resolver: zodResolver(productAttributeValueEditSchema),
        defaultValues: {
            name: value.name,
            translations: buildNameTranslationDefaults(value.translations),
            parentValueId: value.parentValueId ?? "",
        },
        mode: "onChange",
    })
    const selectedParentValueId = useWatch({
        control: form.control,
        name: "parentValueId",
    })

    async function handleSubmit(values: ProductAttributeValueEditFormValues) {
        if (parentAttributeCode && !values.parentValueId) {
            form.setError("parentValueId", {
                type: "manual",
                message: `${parentLabel} seçilmelidir.`,
            })
            return
        }

        try {
            await onSave({
                id: value.id,
                name: values.name.trim(),
                translations: values.translations,
                ...(parentAttributeCode && { parentValueId: values.parentValueId }),
            })
            onCancel()
        } catch {
            // Mutation toast is handled by the manager hook.
        }
    }

    return (
        <Form {...form}>
            <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-3"
                onKeyDown={(event) => {
                    if (event.key === "Escape") {
                        event.preventDefault()
                        onCancel()
                    }
                }}
            >
                <FormField
                    control={form.control}
                    name="translations"
                    render={({ field }) => (
                        <FormItem>
                            <AdminTranslatedNameSection
                                entityLabel="Değer adı"
                                activeLocale={activeLocale}
                                onActiveLocaleChange={setActiveLocale}
                                translations={field.value}
                                onTranslationsChange={field.onChange}
                                targetPlaceholder="English label"
                                variant="plain"
                                disabled={isPending}
                                defaultLocaleField={
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field: nameField }) => (
                                            <FormItem>
                                                <FormLabel>Türkçe değer adı</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...nameField}
                                                        autoFocus
                                                        disabled={isPending}
                                                        placeholder="Değer adı"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                }
                            />
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {parentAttributeCode ? (
                    <FormField
                        control={form.control}
                        name="parentValueId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{parentLabel}</FormLabel>
                                <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                    disabled={isPending}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder={`${parentLabel} seç`} />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {parentValues.map((parentValue) => (
                                            <SelectItem key={parentValue.id} value={parentValue.id}>
                                                {parentValue.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                ) : null}

                <div className="flex flex-wrap justify-end gap-2">
                    <Button
                        size="sm"
                        type="submit"
                        disabled={
                            isPending ||
                            !form.formState.isValid ||
                            (Boolean(parentAttributeCode) && !selectedParentValueId)
                        }
                    >
                        {isPending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Check className="mr-1 h-4 w-4" />}
                        Kaydet
                    </Button>
                    <Button size="sm" type="button" variant="outline" onClick={onCancel} disabled={isPending}>
                        <X className="mr-1 h-4 w-4" />
                        Vazgeç
                    </Button>
                </div>
            </form>
        </Form>
    )
}
