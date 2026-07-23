"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Material } from "@/features/admin/materials/api/types"
import {
    useCreateMaterial,
    usePresignMaterialAsset,
    useUpdateMaterial,
} from "@/features/admin/materials/hooks/useMaterialMutations"

const materialFormSchema = z.object({
    name: z.string().min(1, "Ham madde adı zorunludur"),
    englishName: z.string().optional(),
    code: z.string().optional(),
})

type MaterialFormValues = z.infer<typeof materialFormSchema>

type Props = {
    open: boolean
    material?: Material | null
    onOpenChange: (open: boolean) => void
}

export function MaterialFormDialog({ open, material, onOpenChange }: Props) {
    const [certificateFile, setCertificateFile] = useState<File | null>(null)
    const createMaterialMutation = useCreateMaterial()
    const updateMaterialMutation = useUpdateMaterial()
    const presignMutation = usePresignMaterialAsset()
    const englishTranslation = material?.translations?.find((translation) => translation.locale === "en")

    const form = useForm<MaterialFormValues>({
        resolver: zodResolver(materialFormSchema),
        defaultValues: {
            name: "",
            englishName: "",
            code: "",
        },
    })

    const isEditing = Boolean(material)
    const isPending =
        createMaterialMutation.isPending ||
        updateMaterialMutation.isPending ||
        presignMutation.isPending

    useEffect(() => {
        if (!open) return

        form.reset({
            name: material?.name ?? "",
            englishName: englishTranslation?.name ?? "",
            code: material?.code ?? "",
        })
    }, [englishTranslation?.name, form, material, open])

    function handleOpenChange(nextOpen: boolean) {
        if (!nextOpen) setCertificateFile(null)
        onOpenChange(nextOpen)
    }

    async function uploadCertificate(materialId: string, file: File) {
        const contentType = file.type || "application/pdf"
        if (contentType !== "application/pdf") {
            toast.error("Sadece PDF sertifika yüklenebilir")
            return
        }

        const presigned = await presignMutation.mutateAsync({
            materialId,
            fileName: file.name,
            contentType,
        })

        await axios.put(presigned.uploadUrl, file, {
            headers: {
                "Content-Type": contentType,
            },
        })

        await updateMaterialMutation.mutateAsync({
            id: materialId,
            assetKey: presigned.key,
            assetType: "PDF",
            assetRole: "CERTIFICATE",
            mimeType: contentType,
        })
    }

    const onSubmit = form.handleSubmit(async (values) => {
        const englishName = values.englishName?.trim()
        const payload = {
            name: values.name.trim(),
            code: values.code?.trim() || undefined,
            translations: [
                { locale: "tr" as const, name: values.name.trim() },
                ...(!englishTranslation && englishName
                    ? [{ locale: "en" as const, name: englishName }]
                    : []),
            ],
        }

        try {
            const saved = material
                ? await updateMaterialMutation.mutateAsync({
                    id: material.id,
                    ...payload,
                })
                : await createMaterialMutation.mutateAsync(payload)

            if (certificateFile) {
                await uploadCertificate(saved.id, certificateFile)
            }

            onOpenChange(false)
        } catch {
            // Mutations own user-facing errors.
        }
    })

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "Ham Maddeyi Düzenle" : "Yeni Ham Madde"}</DialogTitle>
                </DialogHeader>

                <form className="space-y-4" onSubmit={(event) => void onSubmit(event)}>
                    <div className="space-y-1.5">
                        <Label htmlFor="material-name">Ad</Label>
                        <Input
                            id="material-name"
                            placeholder="örn. Polipropilen"
                            {...form.register("name")}
                        />
                        {form.formState.errors.name ? (
                            <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                        ) : null}
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="material-english-name">İngilizce Ad</Label>
                        <Input
                            id="material-english-name"
                            placeholder="örn. Polypropylene"
                            disabled={Boolean(englishTranslation)}
                            {...form.register("englishName")}
                        />
                    </div>

                    <div className="space-y-1.5">
                        <Label htmlFor="material-code">Kod</Label>
                        <Input
                            id="material-code"
                            placeholder="örn. PP"
                            {...form.register("code")}
                        />
                    </div>

                    <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
                        <Label htmlFor="material-certificate" className="flex items-center gap-2 text-sm font-medium">
                            <Upload className="h-4 w-4" />
                            PDF Sertifika
                        </Label>
                        <Input
                            id="material-certificate"
                            type="file"
                            accept="application/pdf,.pdf"
                            className="mt-3 bg-white"
                            onChange={(event) => {
                                const file = event.target.files?.[0] ?? null
                                if (file && (file.type || "application/pdf") !== "application/pdf") {
                                    toast.error("Sadece PDF sertifika yüklenebilir")
                                    event.currentTarget.value = ""
                                    setCertificateFile(null)
                                    return
                                }
                                setCertificateFile(file)
                            }}
                        />
                        <p className="mt-2 text-xs text-neutral-500">
                            Yeni dosya mevcut sertifikaları silmez; ham maddeye ek sertifika olarak kaydedilir.
                        </p>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                            İptal
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Kaydet
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
