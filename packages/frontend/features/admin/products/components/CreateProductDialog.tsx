"use client"

import { useMemo, useState } from "react"
import axios from "axios"
import slugify from "slugify"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ImagePlus, Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import {
    InputGroup,
    InputGroupAddon,
    InputGroupText,
    InputGroupTextarea,
} from "@/components/ui/input-group"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useCreateProduct } from "@/features/admin/products/hooks/useCreateProduct"
import { ProductAttributeSelect } from "@/features/admin/productAttributes/components/ProductAttributeSelect"
import { presignProductAsset } from "@/features/admin/products/api/presignProductAsset"
import { productFormSchema, ProductFormValues } from "../schema/productFormSchema"
import type { Product } from "@/features/public/products/types"
import type { Category } from "@/features/public/categories/types"
import type { AssetRole, AssetType } from "@/features/public/assets/types"

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    categories: Category[]
    onCreated: (product: Product) => void
}

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

export function CreateProductDialog({
    open,
    onOpenChange,
    categories,
    onCreated,
}: Props) {
    const createMutation = useCreateProduct()
    const [file, setFile] = useState<File | null>(null)
    const [assetType, setAssetType] = useState<AssetType>("IMAGE")
    const [assetRole, setAssetRole] = useState<AssetRole>("PRIMARY")
    const [uploadProgress, setUploadProgress] = useState(0)

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            code: "",
            description: "",
            categoryId: "",
            attributeValueIds: [],
        },
    })

    const selectedCategoryId = useWatch({ control: form.control, name: "categoryId" })
    const selectedCategory = categories.find((category) => category.id === selectedCategoryId)
    const watchedName = useWatch({ control: form.control, name: "name" })
    const watchedCode = useWatch({ control: form.control, name: "code" })
    const accept = useMemo(() => getAcceptByType(assetType), [assetType])
    const slugPreview = useMemo(
        () => (watchedName ? slugify(watchedName, { lower: true, strict: true, locale: "tr" }) : "urun-slug"),
        [watchedName]
    )

    async function onSubmit(values: ProductFormValues) {
        try {
            let assetKey: string | undefined
            let mimeType: string | undefined

            if (file) {
                const presigned = await presignProductAsset({
                    productSlug: slugPreview,
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

            const product = await createMutation.mutateAsync({
                ...values,
                assetType,
                assetRole,
                assetKey,
                mimeType,
            })

            toast.success("Ürün başarıyla oluşturuldu")
            onCreated(product)
            onOpenChange(false)
            form.reset({
                name: "",
                code: "",
                description: "",
                categoryId: "",
                attributeValueIds: [],
            })
            setFile(null)
            setUploadProgress(0)
            setAssetType("IMAGE")
            setAssetRole("PRIMARY")
        } catch {
            toast.error("Ürün oluşturulamadı")
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
                <DialogHeader className="space-y-2">
                    <DialogTitle>Yeni Ürün</DialogTitle>
                    <DialogDescription>
                        Ürün temel bilgilerini, bağlı kategorisini, attribute seçimlerini ve ilk medya dosyasını tek adımda tanımlayın.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-neutral-200 bg-neutral-50/70 p-5 shadow-sm">
                                <FieldGroup>
                                    <Controller
                                        name="name"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel>Ürün Adı</FieldLabel>
                                                <Input {...field} placeholder="Bakalit Tutamak 10.11" />
                                                {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="code"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel>Ürün Kodu</FieldLabel>
                                                <Input {...field} placeholder="10.11" />
                                                {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="categoryId"
                                        control={form.control}
                                        render={({ field, fieldState }) => (
                                            <Field data-invalid={fieldState.invalid}>
                                                <FieldLabel>Kategori</FieldLabel>
                                                <Select value={field.value} onValueChange={field.onChange}>
                                                    <SelectTrigger className="w-full">
                                                        <SelectValue placeholder="Kategori seç" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {categories.map((category) => (
                                                            <SelectItem key={category.id} value={category.id}>
                                                                {category.code} · {category.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {fieldState.error ? <FieldError errors={[fieldState.error]} /> : null}
                                            </Field>
                                        )}
                                    />

                                    <Controller
                                        name="description"
                                        control={form.control}
                                        render={({ field }) => (
                                            <Field>
                                                <FieldLabel>Açıklama</FieldLabel>
                                                <InputGroup>
                                                    <InputGroupTextarea
                                                        {...field}
                                                        rows={5}
                                                        className="min-h-[132px]"
                                                        placeholder="Ürünün malzeme, kullanım ve fark yaratan özelliklerini girin"
                                                    />
                                                    <InputGroupAddon align="block-end">
                                                        <InputGroupText>{field.value?.length ?? 0}/500</InputGroupText>
                                                    </InputGroupAddon>
                                                </InputGroup>
                                            </Field>
                                        )}
                                    />
                                </FieldGroup>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-neutral-900">Ürün Özeti</div>
                                        <div className="text-xs text-neutral-500">Kod ve slug akışını kategori seçimiyle birlikte kontrol edin.</div>
                                    </div>

                                    {selectedCategory ? (
                                        <Badge variant="outline" className="rounded-full border-neutral-200 bg-neutral-50 text-neutral-600">
                                            {selectedCategory.code} · {selectedCategory.name}
                                        </Badge>
                                    ) : null}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">Slug</div>
                                        <div className="mt-2 text-sm font-medium text-neutral-800">/{slugPreview}</div>
                                    </div>
                                    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-4">
                                        <div className="text-xs uppercase tracking-[0.18em] text-neutral-400">Kod Uyum Kontrolü</div>
                                        <div className="mt-2 text-sm text-neutral-800">
                                            {selectedCategory && watchedCode
                                                ? watchedCode.startsWith(`${selectedCategory.code}.`) || watchedCode === String(selectedCategory.code)
                                                    ? "Kategori kodu ile uyumlu"
                                                    : `${selectedCategory.code} ile başlamalı`
                                                : "Kategori ve kod seçimine göre kontrol edilir"}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                                <div className="mb-4 space-y-1">
                                    <div className="text-sm font-semibold text-neutral-900">Kapak Asset&apos;i</div>
                                    <div className="text-xs text-neutral-500">İlk görseli veya destekleyici medya dosyasını ürün ile birlikte yükleyin.</div>
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
                                        <ImagePlus className="mb-3 h-5 w-5 text-neutral-500" />
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
                                <div className="mb-4 flex items-start justify-between gap-3">
                                    <div className="space-y-1">
                                        <div className="text-sm font-semibold text-neutral-900">Attribute Alanları</div>
                                        <div className="text-xs text-neutral-500">
                                            Sektör, üretim grubu ve kullanım alanı seçimleri arama destekli çoklu yapıda yönetilir.
                                        </div>
                                    </div>
                                    <Badge variant="secondary" className="rounded-full bg-brand/10 text-brand">
                                        <Sparkles className="mr-1 h-3.5 w-3.5" />
                                        Akıllı seçim
                                    </Badge>
                                </div>

                                <Controller
                                    name="attributeValueIds"
                                    control={form.control}
                                    render={({ field }) => (
                                        <ProductAttributeSelect
                                            value={field.value ?? []}
                                            onChange={field.onChange}
                                            allowedAttributeValueIds={selectedCategory?.allowedAttributeValueIds}
                                            singleSelectNonHierarchy
                                        />
                                    )}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Vazgeç
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? "Ürün oluşturuluyor..." : "Ürün Oluştur"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
