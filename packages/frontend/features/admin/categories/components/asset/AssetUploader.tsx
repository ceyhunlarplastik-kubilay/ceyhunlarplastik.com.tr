"use client"

import { useState } from "react"
import axios from "axios"
import slugify from "slugify"

import { UploadDropzone } from "./UploadDropzone"
import { UploadQueue } from "./UploadQueue"

import type { Category } from "@/features/public/categories/types"
import type { AssetRole } from "@/features/public/assets/types"

import { usePresignCategoryAsset } from "@/features/admin/categories/hooks/usePresignCategoryAsset"
import { useUpdateCategory } from "@/features/admin/categories/hooks/useUpdateCategory"

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

export function AssetUploader({
    category,
    activeRole,
    refetchCategory
}: Props) {

    const [uploads, setUploads] = useState<Upload[]>([])

    const presignMutation = usePresignCategoryAsset()
    const updateCategoryMutation = useUpdateCategory()

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

        const slug = slugify(category.name, {
            lower: true,
            strict: true,
            locale: "tr"
        })

        /* 1️⃣ presign */

        const presigned = await presignMutation.mutateAsync({
            categorySlug: slug,
            assetRole: activeRole,
            fileName: upload.file.name,
            contentType: upload.file.type
        })

        const { uploadUrl, key } = presigned

        /* 2️⃣ upload to S3 */

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

        /* 3️⃣ create DB asset */

        await updateCategoryMutation.mutateAsync({

            id: category.id,
            assetKey: key,
            assetRole: activeRole,
            assetType: upload.file.type.startsWith("image")
                ? "IMAGE"
                : upload.file.type.startsWith("video")
                    ? "VIDEO"
                    : "PDF",
            mimeType: upload.file.type

        })

        /* 4️⃣ refresh */

        await refetchCategory()
    }

    return (

        <div className="space-y-4">

            <UploadDropzone onFiles={handleFiles} />

            <UploadQueue uploads={uploads} />

        </div>

    )
}