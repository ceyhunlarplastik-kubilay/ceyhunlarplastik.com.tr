"use client"

import { useMemo, useState } from "react"
import axios from "axios"
import type { ReactNode } from "react"
import {
    Controller,
    useForm,
    useWatch,
    type Control,
    type ControllerRenderProps,
    type FieldPath,
} from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Plus, UploadCloud } from "lucide-react"
import { useCreateCategory } from "../hooks/useCreateCategory"
import { presignCategoryAsset } from "../api/presignCategoryAsset"
import type { AssetRole, AssetType } from "@/features/public/assets/types"
import type { Category } from "@/features/public/categories/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"
import { AdminTranslatedNameSection } from "@/features/admin/shared/translations/AdminTranslatedNameSection"
import {
    ADMIN_DEFAULT_LOCALE,
    adminLocaleLabel,
    adminTranslationIndex,
    type AdminLocale,
} from "@/features/admin/shared/translations/adminLocales"
import {
    buildNameTranslationDefaults,
    buildNameTranslationsPayload,
    nameTranslationFormSchema,
} from "@/features/admin/shared/translations/nameTranslations"
import { buildTranslationSlug } from "@core/i18n/translationSlug"

type Props = {
    onCreated?: (category: Category) => void
}

const PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES = ["sector", "production_group", "usage_area"]

const schema = z.object({
    code: z.number().int().positive("Kod pozitif olmalı"),
    name: z.string().min(2, "Kategori adı gerekli"),
    translations: z.array(nameTranslationFormSchema),
})

type FormValues = z.infer<typeof schema>

function getAcceptByType(assetType: AssetType) {
    switch (assetType) {
        case "IMAGE":
            return "image/*"
        case "VIDEO":
            return "video/*"
        case "PDF":
            return "application/pdf"
        default:
            return "*"
    }
}

export function CategoryCreateForm({ onCreated }: Props) {
    const createMutation = useCreateCategory()
    const [open, setOpen] = useState(false)
    const [file, setFile] = useState<File | null>(null)
    const [assetType, setAssetType] = useState<AssetType>("IMAGE")
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY")
    const [uploadProgress, setUploadProgress] = useState(0)
    const [allowedAttributeValueIds, setAllowedAttributeValueIds] = useState<string[]>([])
    const [activeLocale, setActiveLocale] = useState<AdminLocale>(ADMIN_DEFAULT_LOCALE)

    const accept = useMemo(() => getAcceptByType(assetType), [assetType])

    const form = useForm<FormValues>({
        resolver: zodResolver(schema),
        defaultValues: {
            code: undefined,
            name: "",
            translations: buildNameTranslationDefaults(),
        },
    })

    const watchedName = useWatch({ control: form.control, name: "name" })
    const watchedTranslations = useWatch({ control: form.control, name: "translations" })
    const slugPreview = useMemo(
        () => (watchedName ? buildTranslationSlug(watchedName, ADMIN_DEFAULT_LOCALE) : "kategori-slug"),
        [watchedName]
    )
    // Aktif hedef dilin slug önizlemesi. Backend ile AYNI helper kullanılıyor,
    // böylece ko/ja/zh/hi gibi slug türetilemeyen dillerde önizleme de boş çıkar
    // ve kullanıcı gerçekte ne olacağını görür (backend TR slug'ına düşer).
    const targetSlugPreview = useMemo(() => {
        if (activeLocale === ADMIN_DEFAULT_LOCALE) return null

        const name = watchedTranslations?.[adminTranslationIndex(activeLocale)]?.name?.trim()
        if (!name) return null

        return buildTranslationSlug(name, activeLocale) || slugPreview
    }, [activeLocale, slugPreview, watchedTranslations])

    async function onSubmit(values: FormValues) {
        try {
            let assetKey: string | undefined
            let mimeType: string | undefined

            if (file) {
                const presigned = await presignCategoryAsset({
                    categorySlug: slugPreview,
                    assetRole,
                    fileName: file.name,
                    contentType: file.type,
                })

                await axios.put(presigned.uploadUrl, file, {
                    headers: { "Content-Type": file.type },
                    onUploadProgress: (event) => {
                        const percent = Math.round((event.loaded * 100) / (event.total || 1))
                        setUploadProgress(percent)
                    },
                })

                assetKey = presigned.key
                mimeType = file.type
            }

            const category = await createMutation.mutateAsync({
                code: values.code,
                name: values.name,
                translations: buildNameTranslationsPayload({
                    translations: values.translations,
                }).translations,
                allowedAttributeValueIds,
                assetType,
                assetRole,
                assetKey,
                mimeType,
            })

            onCreated?.(category)
            form.reset({
                code: undefined,
                name: "",
                translations: buildNameTranslationDefaults(),
            })
            setActiveLocale(ADMIN_DEFAULT_LOCALE)
            setAllowedAttributeValueIds([])
            setFile(null)
            setUploadProgress(0)
            setAssetType("IMAGE")
            setAssetRole("PRIMARY")
            setOpen(false)
        } catch {}
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Yeni Kategori
                </Button>
            </DialogTrigger>

            <DialogContent className="max-h-[92vh] max-w-5xl overflow-y-auto">
                <DialogHeader className="space-y-2">
                    <DialogTitle>Yeni Kategori Oluştur</DialogTitle>
                    <DialogDescription>
                        Kategori temel bilgilerini, görünür asset&apos;lerini ve izinli attribute alanlarını tek akışta tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 shadow-sm">
                                <FieldGroup>
                                    <ControllerField
                                        control={form.control}
                                        name="code"
                                        label="Kategori Kodu"
                                        render={({ field }) => (
                                            <Input
                                                {...field}
                                                value={field.value ?? ""}
                                                onChange={(event) => field.onChange(event.target.value === "" ? undefined : Number(event.target.value))}
                                                type="number"
                                                placeholder="10"
                                            />
                                        )}
                                    />

                                    <Controller
                                        name="translations"
                                        control={form.control}
                                        render={({ field }) => (
                                            <AdminTranslatedNameSection
                                                entityLabel="Kategori adı"
                                                activeLocale={activeLocale}
                                                onActiveLocaleChange={setActiveLocale}
                                                translations={field.value}
                                                onTranslationsChange={field.onChange}
                                                targetPlaceholder="Bakelite Handles"
                                                defaultLocaleField={
                                                    <ControllerField
                                                        control={form.control}
                                                        name="name"
                                                        label="Türkçe kategori adı"
                                                        render={({ field: nameField }) => (
                                                            <Input
                                                                {...nameField}
                                                                placeholder="Bakalit Tutamaklar"
                                                            />
                                                        )}
                                                    />
                                                }
                                            />
                                        )}
                                    />

                                    <Field>
                                        <FieldLabel>Slug Önizlemesi</FieldLabel>
                                        <div className="space-y-1 rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600">
                                            <div>Türkçe: /urun-kategori/{slugPreview}</div>
                                            {targetSlugPreview ? (
                                                <div>
                                                    {adminLocaleLabel(activeLocale)}: /{activeLocale}
                                                    /urun-kategori/{targetSlugPreview}
                                                </div>
                                            ) : null}
                                        </div>
                                    </Field>
                                </FieldGroup>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 space-y-1">
                                    <div className="text-sm font-semibold text-neutral-900">Kapak Asset&apos;i</div>
                                    <div className="text-xs text-neutral-500">İlk kategori görseli veya destekleyici medya yükleyin.</div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <Field>
                                        <FieldLabel>Asset Tipi</FieldLabel>
                                        <Select value={assetType} onValueChange={(value) => setAssetType(value as AssetType)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Asset tipi" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="IMAGE">Resim</SelectItem>
                                                <SelectItem value="VIDEO">Video</SelectItem>
                                                <SelectItem value="PDF">PDF</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>

                                    <Field>
                                        <FieldLabel>Asset Rolü</FieldLabel>
                                        <Select value={assetRole} onValueChange={(value) => setAssetRole(value as AssetRole)}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Asset rolü" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="PRIMARY">Primary</SelectItem>
                                                <SelectItem value="ANIMATION">Animation</SelectItem>
                                                <SelectItem value="GALLERY">Gallery</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </Field>
                                </div>

                                <Field className="mt-4">
                                    <FieldLabel>Dosya</FieldLabel>
                                    <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-center transition hover:border-neutral-400 hover:bg-neutral-100/70">
                                        <UploadCloud className="mb-3 h-5 w-5 text-neutral-500" />
                                        <div className="text-sm font-medium text-neutral-800">
                                            {file ? file.name : "Dosya seç veya sürükleyip bırak"}
                                        </div>
                                        <div className="mt-1 text-xs text-neutral-500">
                                            {assetType === "IMAGE" ? "Görsel" : assetType === "VIDEO" ? "Video" : "PDF"} kabul edilir
                                        </div>
                                        <Input
                                            type="file"
                                            accept={accept}
                                            className="hidden"
                                            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                                        />
                                    </label>
                                </Field>

                                {uploadProgress > 0 && uploadProgress < 100 ? (
                                    <div className="mt-4 space-y-2">
                                        <Progress value={uploadProgress} />
                                        <div className="text-xs text-neutral-500">Yükleme %{uploadProgress}</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 space-y-1">
                                    <div className="text-sm font-semibold text-neutral-900">İzinli Attribute Değerleri</div>
                                    <div className="text-xs text-neutral-500">Bu kategori altında açılabilecek ürünlerde görünecek model, bağlantı, profil, malzeme ve benzeri filtre değerlerini tanımlayın.</div>
                                </div>
                                <ProductAttributeSelect
                                    value={allowedAttributeValueIds}
                                    onChange={setAllowedAttributeValueIds}
                                    singleSelectNonHierarchy={false}
                                    excludeAttributeCodes={PRODUCT_FILTER_EXCLUDED_ATTRIBUTE_CODES}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Kategori oluşturuluyor..." : "Kategori Oluştur"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// Alan adına göre GENERIC: aksi hâlde `field.value` tüm alanların birleşimi
// olur ve `translations` dizisi eklendiğinde <Input value> tipi patlar.
type ControllerFieldProps<TName extends FieldPath<FormValues>> = {
    control: Control<FormValues>
    name: TName
    label: string
    render: (props: { field: ControllerRenderProps<FormValues, TName> }) => ReactNode
}

function ControllerField<TName extends FieldPath<FormValues>>({
    control,
    name,
    label,
    render,
}: ControllerFieldProps<TName>) {
    return (
        <Controller
            name={name}
            control={control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel>{label}</FieldLabel>
                    {render({ field })}
                    {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                </Field>
            )}
        />
    )
}
