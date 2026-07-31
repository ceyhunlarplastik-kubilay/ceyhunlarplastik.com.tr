"use client"

import { Controller, type Control } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import {
    PRODUCT_FORM_DEFAULT_LOCALE,
    productTranslationIndex,
    type ProductFormLocale,
    type ProductFormValues,
} from "@/features/admin/products/schema/productFormSchema"
import { adminLocaleLabel } from "@/features/admin/shared/translations/adminLocales"

type Props = {
    control: Control<ProductFormValues>
    locale: ProductFormLocale
    /** Varsayılan dilde slug ürün adından türetilir; burada yalnız gösterilir. */
    slugPreview: string
}

const DESCRIPTION_LIMIT = 500

/**
 * Ürünün dile bağlı alanları (ad / slug / açıklama), aktif dile göre.
 *
 * Varsayılan dil ürünün kendi kolonlarını (`name`, `description`) düzenler ve
 * slug addan türetildiği için salt-okunur gösterilir. Hedef diller
 * `translations.<index>` altına yazar ve slug'ı elle düzenlenebilir.
 */
export function ProductTranslatableFields({ control, locale, slugPreview }: Props) {
    if (locale === PRODUCT_FORM_DEFAULT_LOCALE) {
        return (
            <div className="space-y-4">
                <Controller
                    name="name"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Ürün adı</FieldLabel>
                            <Input {...field} placeholder="Bakalit Tutamak" />
                            {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                    )}
                />

                <Field>
                    <FieldLabel>Slug</FieldLabel>
                    <div className="flex items-center gap-2 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2">
                        <span className="text-xs text-neutral-400">/urun/</span>
                        <span className="truncate font-mono text-xs text-neutral-700">
                            {slugPreview}
                        </span>
                    </div>
                    <p className="text-xs text-neutral-500">Ürün adından otomatik üretilir.</p>
                </Field>

                <Controller
                    name="description"
                    control={control}
                    render={({ field, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                            <FieldLabel>Açıklama</FieldLabel>
                            <InputGroup>
                                <InputGroupTextarea
                                    {...field}
                                    value={field.value ?? ""}
                                    rows={5}
                                    className="min-h-[132px]"
                                    placeholder="Malzeme, kullanım ve ürünü ayıran özellikler"
                                />
                                <InputGroupAddon align="block-end">
                                    <InputGroupText className="tabular-nums">
                                        {field.value?.length ?? 0}/{DESCRIPTION_LIMIT}
                                    </InputGroupText>
                                </InputGroupAddon>
                            </InputGroup>
                            {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                        </Field>
                    )}
                />
            </div>
        )
    }

    const index = productTranslationIndex(locale)
    const localeLabel = adminLocaleLabel(locale)

    return (
        <div className="space-y-4">
            <p className="text-xs leading-5 text-neutral-500">
                Boş bırakılırsa {localeLabel} çevirisi oluşturulmaz ve o dilde Türkçe içerik gösterilir.
            </p>

            <Controller
                name={`translations.${index}.name`}
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{localeLabel} ürün adı</FieldLabel>
                        <Input {...field} value={field.value ?? ""} placeholder="Bakelite Handle" />
                        {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                )}
            />

            <Controller
                name={`translations.${index}.slug`}
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{localeLabel} slug</FieldLabel>
                        <Input
                            {...field}
                            value={field.value ?? ""}
                            className="font-mono text-xs"
                            placeholder="bakelite-handle"
                        />
                        {fieldState.error ? (
                            <FieldError errors={[fieldState.error]} />
                        ) : (
                            <p className="text-xs text-neutral-500">Boşsa {localeLabel} addan üretilir.</p>
                        )}
                    </Field>
                )}
            />

            <Controller
                name={`translations.${index}.description`}
                control={control}
                render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                        <FieldLabel>{localeLabel} açıklama</FieldLabel>
                        <InputGroup>
                            <InputGroupTextarea
                                {...field}
                                value={field.value ?? ""}
                                rows={5}
                                className="min-h-[132px]"
                                placeholder="Translated product description"
                            />
                            <InputGroupAddon align="block-end">
                                <InputGroupText className="tabular-nums">
                                    {field.value?.length ?? 0}/{DESCRIPTION_LIMIT}
                                </InputGroupText>
                            </InputGroupAddon>
                        </InputGroup>
                        {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                    </Field>
                )}
            />
        </div>
    )
}
