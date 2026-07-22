"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { ImagePlus, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { validateAttributeValueImage } from "@/features/admin/productAttributes/api/productAttributeValueApi"
import {
    productAttributeValueCreateSchema,
    type ProductAttributeValueCreateFormValues,
} from "@/features/admin/productAttributes/schema/productAttributeValueForms"
import type { ProductAttributeValue } from "@/features/admin/productAttributes/types"

type Props = {
    attributeId: string
    currentLabel: string
    parentAttributeCode: string | null
    parentLabel: string
    parentValues: ProductAttributeValue[]
    isPending: boolean
    onCreate: (input: {
        name: string
        englishName?: string
        parentValueId?: string
        file?: File | null
    }) => Promise<void>
}

export function ProductAttributeValueCreatePanel({
    attributeId,
    currentLabel,
    parentAttributeCode,
    parentLabel,
    parentValues,
    isPending,
    onCreate,
}: Props) {
    const imageInputId = `new-attribute-value-image-${attributeId}`
    const [imageInputResetKey, setImageInputResetKey] = useState(0)

    const form = useForm<ProductAttributeValueCreateFormValues>({
        resolver: zodResolver(productAttributeValueCreateSchema),
        defaultValues: {
            name: "",
            englishName: "",
            parentValueId: "",
            imageFile: null,
        },
        mode: "onChange",
    })
    const selectedFile = useWatch({
        control: form.control,
        name: "imageFile",
    })
    const selectedParentValueId = useWatch({
        control: form.control,
        name: "parentValueId",
    })

    const previewUrl = useMemo(
        () => selectedFile ? URL.createObjectURL(selectedFile) : null,
        [selectedFile],
    )

    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl)
        }
    }, [previewUrl])

    function clearImageFile() {
        form.setValue("imageFile", null, { shouldDirty: true, shouldValidate: true })
        setImageInputResetKey((current) => current + 1)
    }

    function handleFile(file?: File | null) {
        if (!file) return

        const validationError = validateAttributeValueImage(file)
        if (validationError) {
            form.setError("imageFile", { type: "manual", message: validationError })
            toast.error(validationError)
            setImageInputResetKey((current) => current + 1)
            return
        }

        form.clearErrors("imageFile")
        form.setValue("imageFile", file, { shouldDirty: true, shouldValidate: true })
    }

    async function handleSubmit(values: ProductAttributeValueCreateFormValues) {
        if (parentAttributeCode && !values.parentValueId) {
            form.setError("parentValueId", {
                type: "manual",
                message: `${parentLabel} seçilmelidir.`,
            })
            return
        }

        try {
            await onCreate({
                name: values.name.trim(),
                englishName: values.englishName?.trim(),
                ...(parentAttributeCode && { parentValueId: values.parentValueId }),
                file: values.imageFile ?? null,
            })

            form.reset()
            setImageInputResetKey((current) => current + 1)
        } catch {
            // Mutation toast and field-safe API handling live in the manager hook.
        }
    }

    return (
        <section className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm">
            <div className="flex flex-col gap-2 border-b border-neutral-100 bg-gradient-to-br from-neutral-50 via-white to-neutral-50 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold tracking-tight text-neutral-950">
                        {currentLabel} Değerleri
                    </h2>
                    <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Değer adlarını, üst ilişkiyi ve müşteri tarafında görünen görselleri yönetin.
                    </p>
                </div>
                <Badge variant="outline" className="w-fit bg-white">
                    Yeni değer
                </Badge>
            </div>

            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className={[
                        "grid min-w-0 gap-4 p-4 lg:items-start",
                        parentAttributeCode
                            ? "lg:grid-cols-[minmax(0,1fr)_minmax(180px,240px)_minmax(180px,220px)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(200px,260px)_minmax(200px,260px)_auto]"
                            : "lg:grid-cols-[minmax(0,1fr)_minmax(180px,260px)_auto] xl:grid-cols-[minmax(0,1fr)_minmax(200px,280px)_auto]",
                    ].join(" ")}
                >
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="min-w-0">
                                <FormLabel>Yeni değer</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder={`${currentLabel} adı yazın`}
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="englishName"
                        render={({ field }) => (
                            <FormItem className="min-w-0">
                                <FormLabel>İngilizce değer</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                        placeholder="English label"
                                        disabled={isPending}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    {parentAttributeCode ? (
                        <FormField
                            control={form.control}
                            name="parentValueId"
                            render={({ field }) => (
                                <FormItem className="min-w-0">
                                    <FormLabel>{parentLabel}</FormLabel>
                                    <Select
                                        value={field.value || ""}
                                        onValueChange={field.onChange}
                                        disabled={isPending}
                                    >
                                        <FormControl>
                                            <SelectTrigger className="min-w-0 bg-white">
                                                <SelectValue placeholder={`${parentLabel} seç`} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {parentValues.map((value) => (
                                                <SelectItem key={value.id} value={value.id}>
                                                    {value.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    ) : null}

                    <FormField
                        control={form.control}
                        name="imageFile"
                        render={() => (
                            <FormItem className="min-w-0">
                                <FormLabel>Görsel</FormLabel>
                                <FormControl>
                                    <div className="min-w-0 space-y-2">
                                        <input
                                            key={imageInputResetKey}
                                            id={imageInputId}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            disabled={isPending}
                                            onChange={(event) => handleFile(event.target.files?.[0])}
                                        />
                                        <div className="flex min-w-0 gap-2">
                                            <label
                                                htmlFor={imageInputId}
                                                className="flex h-10 min-w-0 max-w-full flex-1 cursor-pointer items-center gap-2 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 transition hover:bg-neutral-50"
                                            >
                                                <ImagePlus className="h-4 w-4 shrink-0 text-neutral-400" />
                                                <span className="truncate">
                                                    {selectedFile ? selectedFile.name : "Opsiyonel görsel seç"}
                                                </span>
                                            </label>
                                            {selectedFile ? (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-10 w-10 shrink-0"
                                                    onClick={clearImageFile}
                                                    disabled={isPending}
                                                    aria-label="Seçili görseli kaldır"
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            ) : null}
                                        </div>
                                        {previewUrl ? (
                                            <div className="max-w-full rounded-xl border border-neutral-200 bg-neutral-50 p-2">
                                                <div className="relative mx-auto aspect-[16/10] w-full max-w-72 overflow-hidden rounded-lg bg-white">
                                                    <Image
                                                        src={previewUrl}
                                                        alt="Seçili görsel önizlemesi"
                                                        fill
                                                        unoptimized
                                                        sizes="(min-width: 1280px) 260px, (min-width: 1024px) 220px, 288px"
                                                        className="object-contain"
                                                    />
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="flex min-w-0 items-end">
                        <Button
                            type="submit"
                            className="h-10 w-full gap-2"
                            disabled={
                                isPending ||
                                !form.formState.isValid ||
                                (Boolean(parentAttributeCode) && !selectedParentValueId)
                            }
                        >
                            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            {isPending ? "Ekleniyor" : "Ekle"}
                        </Button>
                    </div>
                </form>
            </Form>
        </section>
    )
}
