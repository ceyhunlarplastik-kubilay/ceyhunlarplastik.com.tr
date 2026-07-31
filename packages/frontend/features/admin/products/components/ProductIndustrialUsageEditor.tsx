"use client"

import { useMemo, useRef, useState } from "react"
import axios from "axios"
import { Factory, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Field, FieldLabel } from "@/components/ui/field"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"
import { usePresignProductAsset } from "@/features/admin/products/hooks/usePresignProductAsset"
import {
    PRODUCT_FORM_DEFAULT_LOCALE,
    type ProductFormLocale,
    type ProductIndustrialUsageFormValues,
} from "@/features/admin/products/schema/productFormSchema"
import { adminLocaleLabel } from "@/features/admin/shared/translations/adminLocales"

const NONE_VALUE = "__none__"
const INDUSTRIAL_ATTRIBUTE_CODES = {
    sector: "sector",
    productionGroup: "production_group",
    usageArea: "usage_area",
} as const

type AttributeValueOption = {
    id: string
    name: string
    parentValueId?: string | null
}

type Props = {
    productSlug: string
    value: ProductIndustrialUsageFormValues[]
    onChange: (value: ProductIndustrialUsageFormValues[]) => void
    /** Dialog'un locale sekmesinden gelir; metin ve gorsel bu dile gore gosterilir. */
    activeLocale: ProductFormLocale
}

function normalizeRows(rows: ProductIndustrialUsageFormValues[]) {
    return rows.map((row, index) => ({
        ...row,
        sectorValueId: row.sectorValueId || null,
        productionGroupValueId: row.productionGroupValueId || null,
        usageAreaValueId: row.usageAreaValueId || null,
        usageFunction: row.usageFunction ?? "",
        translations: row.translations ?? [],
        imageKey: row.imageKey?.trim() || null,
        imageUrl: row.imageUrl ?? null,
        displayOrder: index,
    }))
}

type UploadSlot = { index: number; locale: ProductFormLocale }

function getTranslation(row: ProductIndustrialUsageFormValues, locale: ProductFormLocale) {
    return row.translations?.find((translation) => translation.locale === locale)
}

/**
 * Aktif dilin metni/gorseli nerede yasiyor?
 *  - varsayilan dil -> satirin kendi `usageFunction` / `imageKey` kolonlari
 *  - hedef dil       -> `translations[locale]` girdisi
 */
function readLocaleContent(row: ProductIndustrialUsageFormValues, locale: ProductFormLocale) {
    if (locale === PRODUCT_FORM_DEFAULT_LOCALE) {
        return {
            usageFunction: row.usageFunction ?? "",
            imageKey: row.imageKey ?? null,
            imageUrl: row.imageUrl ?? null,
        }
    }

    const translation = getTranslation(row, locale)

    return {
        usageFunction: translation?.usageFunction ?? "",
        imageKey: translation?.imageKey ?? null,
        imageUrl: translation?.imageUrl ?? null,
    }
}

function keepSelectedOption(options: AttributeValueOption[], allOptions: AttributeValueOption[], selectedId?: string | null) {
    if (!selectedId || options.some((item) => item.id === selectedId)) return options
    const selected = allOptions.find((item) => item.id === selectedId)
    return selected ? [selected, ...options] : options
}

export function ProductIndustrialUsageEditor({ productSlug, value, onChange, activeLocale }: Props) {
    const { data: attributes, isLoading } = useAttributesForFilter()
    const presignMutation = usePresignProductAsset()
    const [uploadingSlot, setUploadingSlot] = useState<UploadSlot | null>(null)
    // Latest-ref deseni: updateRow/emit event handler'ları en güncel `value`
    // prop'unu bayat closure olmadan okusun diye render'da senkronlanır. Effect'e
    // taşımak ref'i bir commit geciktirir → art arda satır düzenlemelerinde veri
    // kaybı. Bu bilinçli, yaygın ve güvenli bir kullanım.
    const valueRef = useRef(value)
    // eslint-disable-next-line react-hooks/refs
    valueRef.current = value

    const sectorValues = useMemo(
        () => attributes?.find((attribute) => attribute.code === INDUSTRIAL_ATTRIBUTE_CODES.sector)?.values ?? [],
        [attributes],
    )
    const productionGroupValues = useMemo(
        () => attributes?.find((attribute) => attribute.code === INDUSTRIAL_ATTRIBUTE_CODES.productionGroup)?.values ?? [],
        [attributes],
    )
    const usageAreaValues = useMemo(
        () => attributes?.find((attribute) => attribute.code === INDUSTRIAL_ATTRIBUTE_CODES.usageArea)?.values ?? [],
        [attributes],
    )

    function emit(rows: ProductIndustrialUsageFormValues[]) {
        onChange(normalizeRows(rows))
    }

    function updateRow(index: number, patch: Partial<ProductIndustrialUsageFormValues>) {
        emit(valueRef.current.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)))
    }

    function addRow() {
        emit([
            ...valueRef.current,
            {
                sectorValueId: null,
                productionGroupValueId: null,
                usageAreaValueId: null,
                usageFunction: "",
                translations: [],
                imageKey: null,
                imageUrl: null,
                displayOrder: valueRef.current.length,
            },
        ])
    }

    function removeRow(index: number) {
        emit(valueRef.current.filter((_, rowIndex) => rowIndex !== index))
    }

    /**
     * Hedef dilin çeviri girdisini yamalar. Girdi ancak METİN VE GÖRSEL birlikte
     * boşsa diziden düşürülür — yalnız metne bakmak görseli de silerdi. Diziden
     * düşen locale backend'de o satırı sildirir.
     */
    function patchTranslation(
        index: number,
        locale: ProductFormLocale,
        patch: { usageFunction?: string | null; imageKey?: string | null; imageUrl?: string | null },
    ) {
        const current = valueRef.current[index]
        if (!current) return

        const currentTranslations = current.translations ?? []
        const currentEntry = currentTranslations.find((translation) => translation.locale === locale)
        const otherTranslations = currentTranslations.filter((translation) => translation.locale !== locale)

        const nextEntry = {
            locale,
            usageFunction: patch.usageFunction !== undefined
                ? patch.usageFunction
                : currentEntry?.usageFunction ?? null,
            imageKey: patch.imageKey !== undefined ? patch.imageKey : currentEntry?.imageKey ?? null,
            imageUrl: patch.imageUrl !== undefined ? patch.imageUrl : currentEntry?.imageUrl ?? null,
        }

        const isEmpty = !nextEntry.usageFunction?.trim() && !nextEntry.imageKey

        updateRow(index, {
            translations: isEmpty ? otherTranslations : [...otherTranslations, nextEntry],
        })
    }

    /** Aktif dile göre doğru yere yazar: varsayılan dil satırın kolonlarına, diğerleri çeviriye. */
    function writeLocaleContent(
        index: number,
        locale: ProductFormLocale,
        patch: { usageFunction?: string | null; imageKey?: string | null; imageUrl?: string | null },
    ) {
        if (locale === PRODUCT_FORM_DEFAULT_LOCALE) {
            updateRow(index, patch)
            return
        }

        patchTranslation(index, locale, patch)
    }

    async function handleSelectImage(index: number, locale: ProductFormLocale, file?: File | null) {
        if (!file) return

        if (!file.type.startsWith("image/")) {
            toast.error("Sadece görsel dosyaları yükleyebilirsiniz")
            return
        }

        setUploadingSlot({ index, locale })

        try {
            const presigned = await presignMutation.mutateAsync({
                productSlug,
                fileName: file.name,
                contentType: file.type,
                purpose: "INDUSTRIAL_USAGE_IMAGE",
                locale,
            })

            await axios.put(presigned.uploadUrl, file, {
                headers: {
                    "Content-Type": file.type,
                },
            })

            writeLocaleContent(index, locale, { imageKey: presigned.key, imageUrl: presigned.url })

            // Dosya S3'e gitti ama imageKey henüz yalnız form state'inde;
            // DB'ye ancak ürün kaydedilince yazılıyor.
            toast.success("Görsel yüklendi — kalıcı olması için ürünü kaydedin")
        } catch {
            toast.error("Kullanım görseli yüklenemedi")
        } finally {
            setUploadingSlot(null)
        }
    }

    function clearImage(index: number, locale: ProductFormLocale) {
        writeLocaleContent(index, locale, { imageKey: null, imageUrl: null })
    }

    const isDefaultLocale = activeLocale === PRODUCT_FORM_DEFAULT_LOCALE
    const localeLabel = adminLocaleLabel(activeLocale)

    return (
        <section className="rounded-xl border border-neutral-200 bg-white p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-brand/10 p-2 text-brand">
                        <Factory className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
                            Endüstriyel kullanım alanları
                        </h3>
                        <p className="max-w-prose text-xs leading-5 text-neutral-500">
                            Sektör, üretim grubu ve kullanım alanı kategori filtre attribute&apos;u değil; ürünün
                            kullanım satırları olarak yönetilir. Metin ve görsel{" "}
                            <strong className="font-semibold text-neutral-700">{localeLabel}</strong> için düzenleniyor.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="rounded-full tabular-nums">
                        {value.length} satır
                    </Badge>
                    <Button type="button" size="sm" variant="outline" onClick={addRow}>
                        <Plus className="mr-1.5 h-4 w-4" />
                        Satır ekle
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
                    Endüstriyel taxonomy değerleri yükleniyor...
                </div>
            ) : value.length === 0 ? (
                <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-6 text-sm text-neutral-600">
                    Henüz kullanım satırı eklenmedi. Ürün detayındaki endüstriyel kullanım tablosunu ve müşteri profil eşleşmesini beslemek için satır ekleyin.
                </div>
            ) : (
                <div className="space-y-3">
                    {value.map((row, index) => {
                        const visibleProductionGroups = row.sectorValueId
                            ? productionGroupValues.filter((item) => item.parentValueId === row.sectorValueId)
                            : productionGroupValues
                        const visibleUsageAreas = row.productionGroupValueId
                            ? usageAreaValues.filter((item) => item.parentValueId === row.productionGroupValueId)
                            : usageAreaValues
                        const productionOptions = keepSelectedOption(visibleProductionGroups, productionGroupValues, row.productionGroupValueId)
                        const usageAreaOptions = keepSelectedOption(visibleUsageAreas, usageAreaValues, row.usageAreaValueId)
                        const localeContent = readLocaleContent(row, activeLocale)
                        const isUploadingThisRow =
                            uploadingSlot?.index === index && uploadingSlot.locale === activeLocale

                        return (
                            <div key={index} className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-400">
                                        Satır {index + 1}
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 rounded-full px-2 text-neutral-500 hover:bg-red-50 hover:text-red-600"
                                        onClick={() => removeRow(index)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        <span className="sr-only">Satırı kaldır</span>
                                    </Button>
                                </div>

                                <div className="grid gap-3 lg:grid-cols-3">
                                    <Select
                                        value={row.sectorValueId ?? NONE_VALUE}
                                        onValueChange={(nextValue) =>
                                            updateRow(index, {
                                                sectorValueId: nextValue === NONE_VALUE ? null : nextValue,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Sektör" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Sektör yok</SelectItem>
                                            {sectorValues.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={row.productionGroupValueId ?? NONE_VALUE}
                                        onValueChange={(nextValue) =>
                                            updateRow(index, {
                                                productionGroupValueId: nextValue === NONE_VALUE ? null : nextValue,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Üretim Grubu" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Üretim grubu yok</SelectItem>
                                            {productionOptions.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={row.usageAreaValueId ?? NONE_VALUE}
                                        onValueChange={(nextValue) =>
                                            updateRow(index, {
                                                usageAreaValueId: nextValue === NONE_VALUE ? null : nextValue,
                                            })
                                        }
                                    >
                                        <SelectTrigger className="w-full rounded-xl">
                                            <SelectValue placeholder="Kullanım Alanı" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value={NONE_VALUE}>Kullanım alanı yok</SelectItem>
                                            {usageAreaOptions.map((item) => (
                                                <SelectItem key={item.id} value={item.id}>
                                                    {item.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(240px,300px)]">
                                    <Field>
                                        <FieldLabel className="text-xs">
                                            Kullanım fonksiyonu · {localeLabel}
                                        </FieldLabel>
                                        <Textarea
                                            value={localeContent.usageFunction}
                                            onChange={(event) =>
                                                writeLocaleContent(index, activeLocale, {
                                                    usageFunction: event.target.value,
                                                })
                                            }
                                            rows={6}
                                            placeholder={
                                                isDefaultLocale
                                                    ? "Bu ürün bu kullanım alanında nasıl fayda sağlar? Örn. Çekyat gövdesine cıvata bağlantısı ile sabitlenerek sağlam taşıyıcı ayak görevi görür."
                                                    : `${localeLabel} kullanım fonksiyonu — boş bırakılırsa Türkçe metin gösterilir.`
                                            }
                                        />
                                    </Field>

                                    <Field>
                                        <FieldLabel className="text-xs">
                                            Örnek görsel · {localeLabel}
                                        </FieldLabel>

                                        {localeContent.imageUrl ? (
                                            <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
                                                <div className="aspect-[4/3] bg-neutral-100">
                                                    {/* Next Image kullanılmaz: geçici presign URL'leri remotePatterns'e girmiyor. */}
                                                    <img
                                                        src={localeContent.imageUrl}
                                                        alt={`Kullanım görseli (${activeLocale})`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex aspect-[4/3] items-center justify-center rounded-lg border border-dashed border-neutral-300 bg-white px-3 text-center text-xs leading-4 text-neutral-500">
                                                {isDefaultLocale
                                                    ? "Bu satır için henüz görsel eklenmedi."
                                                    : `${localeLabel} görseli yoksa Türkçe görsel kullanılır.`}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-1.5">
                                            <label className="cursor-pointer">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    disabled={uploadingSlot !== null}
                                                    onChange={(event) => {
                                                        void handleSelectImage(index, activeLocale, event.target.files?.[0])
                                                        event.currentTarget.value = ""
                                                    }}
                                                />
                                                <span className="inline-flex h-8 items-center gap-1.5 rounded-md border border-neutral-300 bg-white px-2.5 text-xs font-medium text-neutral-700 transition-colors duration-200 hover:bg-neutral-100">
                                                    {isUploadingThisRow ? (
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                    ) : (
                                                        <ImagePlus className="h-3 w-3" />
                                                    )}
                                                    {localeContent.imageKey ? "Değiştir" : "Yükle"}
                                                </span>
                                            </label>

                                            {localeContent.imageKey ? (
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 px-2 text-xs text-neutral-500 hover:text-red-600"
                                                    onClick={() => clearImage(index, activeLocale)}
                                                >
                                                    <X className="mr-1 h-3 w-3" />
                                                    Kaldır
                                                </Button>
                                            ) : null}
                                        </div>

                                        <p className="text-[11px] leading-4 text-neutral-500">
                                            Görseller <strong className="font-semibold">ürün kaydedilene kadar</strong> kalıcı olmaz.
                                        </p>
                                    </Field>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    )
}
