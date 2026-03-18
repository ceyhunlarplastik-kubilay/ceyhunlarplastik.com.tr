"use client"

import { useState } from "react"
import axios from "axios"

import slugify from "slugify"

import { UploadDropzone } from "@/features/admin/products/components/asset/UploadDropzone"
import { UploadQueue } from "@/features/admin/products/components/asset/UploadQueue"

import type { Product } from "@/features/public/products/types"
import type { AssetRole } from "@/features/public/assets/types"

import { usePresignProductAsset } from "@/features/admin/products/hooks/usePresignProductAsset"
import { useUpdateProduct } from "@/features/admin/products/hooks/useUpdateProduct"

type Upload = {
    id: string
    file: File
    progress: number
}

type Props = {
    product: Product
    activeRole: AssetRole
    refetchProduct: () => Promise<void>
}

export function AssetUploader({
    product,
    activeRole,
    refetchProduct
}: Props) {

    const [uploads, setUploads] = useState<Upload[]>([])

    const presignMutation = usePresignProductAsset()
    const updateProductMutation = useUpdateProduct()

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

        const slug = slugify(product.name, {
            lower: true,
            strict: true
        })

        const presigned = await presignMutation.mutateAsync({

            productSlug: slug,
            assetRole: activeRole,
            fileName: upload.file.name,
            contentType: upload.file.type

        })

        const { uploadUrl, key } = presigned

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

        await updateProductMutation.mutateAsync({

            id: product.id,
            assetKey: key,
            assetRole: activeRole,
            assetType: upload.file.type.startsWith("image")
                ? "IMAGE"
                : upload.file.type.startsWith("video")
                    ? "VIDEO"
                    : "PDF",
            mimeType: upload.file.type

        })

        await refetchProduct()

    }

    return (

        <div className="space-y-4">

            <UploadDropzone onFiles={handleFiles} />

            <UploadQueue uploads={uploads} />

        </div>

    )

}