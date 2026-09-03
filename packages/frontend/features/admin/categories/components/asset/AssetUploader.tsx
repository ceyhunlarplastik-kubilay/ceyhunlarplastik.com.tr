"use client"

import { useState } from "react"
import axios from "axios"
import slugify from "slugify"
import { toast } from "sonner"

import { UploadDropzone } from "./UploadDropzone"
import { UploadQueue } from "./UploadQueue"

import type { Category } from "@/features/public/categories/types"
import type { AssetRole } from "@/features/public/assets/types"

import { usePresignCategoryAsset } from "@/features/admin/categories/hooks/usePresignCategoryAsset"

type Upload = {
    id: string
    file: File
    progress: number
}

type Props = {
    category: Category
    activeRole: AssetRole
    refetchCategory: () => Promise<void>
}

function resolveAssetType(mime: string) {
    if (mime.startsWith("image")) return "IMAGE"
    if (mime.startsWith("video")) return "VIDEO"
    return "PDF"
}

export function AssetUploader({
    category,
    activeRole,
    refetchCategory
}: Props) {

    const [uploads, setUploads] = useState<Upload[]>([])

    const presignMutation = usePresignCategoryAsset()

    const handleFiles = (files: File[]) => {

        const newUploads = files.map(file => ({
            id: crypto.randomUUID(),
            file,
            progress: 0
        }))

        setUploads(prev => [...prev, ...newUploads])

        newUploads.forEach(uploadFile)
    }

    const uploadFile = async (upload: Upload) => {
        try {
            const slug = slugify(category.name, {
                lower: true,
                strict: true,
                locale: "tr"
            })

            // Presign artık PENDING_UPLOAD Asset satırını da oluşturur. S3'e PUT
            // bitince kayıt için beklemeye gerek yok: S3 ObjectCreated event'i
            // satırı ACTIVE'e çevirir (confirmCategoryAssetUpload). Buradaki tek
            // refetch geçici — Slice 3 optimistic + reconciler ile kaldıracak.
            const presigned = await presignMutation.mutateAsync({
                categoryId: category.id,
                categorySlug: slug,
                assetRole: activeRole,
                assetType: resolveAssetType(upload.file.type),
                fileName: upload.file.name,
                contentType: upload.file.type
            })

            const { uploadUrl } = presigned

            await axios.put(uploadUrl, upload.file, {

                headers: {
                    "Content-Type": upload.file.type
                },

                onUploadProgress: (e) => {

                    const percent = Math.round(
                        (e.loaded * 100) / (e.total || 1)
                    )

                    setUploads(prev =>
                        prev.map(u =>
                            u.id === upload.id
                                ? { ...u, progress: percent }
                                : u
                        )
                    )

                }

            })

            // Kayıt (PENDING_UPLOAD) presign'da zaten oluştu. Bloklamadan tazele;
            // usePendingAssetReconciler S3 onayına kadar tazelemeyi sürdürür.
            void refetchCategory()
            toast.success(`${upload.file.name} yüklendi — arka planda işleniyor`)
        } catch {
            toast.error(`${upload.file.name} yüklenemedi`)
        }
    }

    return (

        <div className="space-y-4">

            <UploadDropzone onFiles={handleFiles} />

            <UploadQueue uploads={uploads} />

        </div>

    )
}
