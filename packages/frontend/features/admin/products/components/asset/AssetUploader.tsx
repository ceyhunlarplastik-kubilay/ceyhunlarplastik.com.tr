"use client"

import { useState } from "react"
import axios from "axios"
import { toast } from "sonner"

import slugify from "slugify"

import { UploadDropzone } from "@/features/admin/products/components/asset/UploadDropzone"
import { UploadQueue } from "@/features/admin/products/components/asset/UploadQueue"

import type { Product } from "@/features/public/products/types"
import type { AssetRole } from "@/features/public/assets/types"

import { usePresignProductAsset } from "@/features/admin/products/hooks/usePresignProductAsset"
import { useUpdateProduct } from "@/features/admin/products/hooks/useUpdateProduct"
import {
    Model3dGlbValidationError,
    validateModel3dGlbFile,
} from "@/features/admin/products/utils/validateModel3dGlb"
import type { ProductModel3dConfig } from "@core/helpers/products/model3dConfig"

type Upload = {
    id: string
    file: File
    progress: number
    model3dConfig?: ProductModel3dConfig
}

type Props = {
    product: Product
    activeRole: AssetRole
    refetchProduct: () => Promise<void>
}

const MODEL_3D_ACCEPT = {
    "model/gltf-binary": [".glb"],
    "application/octet-stream": [".glb"],
}

function isModel3DFile(file: File) {
    return file.name.toLowerCase().endsWith(".glb")
}

function resolveContentType(file: File) {
    const name = file.name.toLowerCase()
    if (name.endsWith(".glb")) return "model/gltf-binary"
    return file.type || "application/octet-stream"
}

export function AssetUploader({
    product,
    activeRole,
    refetchProduct
}: Props) {

    const [uploads, setUploads] = useState<Upload[]>([])

    const presignMutation = usePresignProductAsset()
    const updateProductMutation = useUpdateProduct()

    const handleFiles = async (selectedFiles: File[]) => {

        let files = selectedFiles
        if (activeRole === "MODEL_3D" && files.some(file => !isModel3DFile(file))) {
            toast.error("3D model alanı yalnız tek dosyalık .glb modellerini kabul eder")
            files = files.filter(isModel3DFile)
        }

        if (!files.length) return

        const newUploads: Upload[] = []
        for (const file of files) {
            try {
                const inspection = activeRole === "MODEL_3D"
                    ? await validateModel3dGlbFile(file)
                    : null

                newUploads.push({
                    id: crypto.randomUUID(),
                    file,
                    progress: 0,
                    ...(inspection?.model3dConfig
                        ? { model3dConfig: inspection.model3dConfig }
                        : {}),
                })

                if (activeRole === "MODEL_3D") {
                    toast.success(inspection?.model3dConfig
                        ? `${file.name}: parametrik R3F yapılandırması doğrulandı`
                        : `${file.name}: statik GLB doğrulandı; model-viewer kullanılacak`)
                }
            } catch (error) {
                const message = error instanceof Model3dGlbValidationError
                    ? error.message
                    : "GLB dosyası doğrulanamadı"
                toast.error(`${file.name}: ${message}`)
            }
        }

        if (!newUploads.length) return

        setUploads(prev => [...prev, ...newUploads])

        newUploads.forEach(uploadFile)

    }

    const uploadFile = async (upload: Upload) => {
        try {
            const contentType = resolveContentType(upload.file)
            const slug = slugify(product.name, {
                lower: true,
                strict: true
            })

            const presigned = await presignMutation.mutateAsync({

                productSlug: slug,
                assetRole: activeRole,
                fileName: upload.file.name,
                contentType

            })

            const { uploadUrl, key } = presigned

            await axios.put(uploadUrl, upload.file, {

                headers: {
                    "Content-Type": contentType
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
                // MODEL_3D rolü semantik kaynaktır. Mevcut AssetType şemasında
                // ayrı 3D değeri bulunmadığı için teknik dosya tipini kullanırız.
                assetType: activeRole === "MODEL_3D"
                    ? "TECHNICAL_DRAWING"
                    : contentType.startsWith("image")
                        ? "IMAGE"
                        : contentType.startsWith("video")
                            ? "VIDEO"
                            : "PDF",
                mimeType: contentType,
                model3dConfig: upload.model3dConfig,

            })

            await refetchProduct()
            toast.success(`${upload.file.name} ürün asset'i olarak yüklendi`)
        } catch {
            toast.error(`${upload.file.name} yüklenemedi`)
        }
    }

    return (

        <div className="space-y-4">

            <UploadDropzone
                onFiles={handleFiles}
                accept={activeRole === "MODEL_3D" ? MODEL_3D_ACCEPT : undefined}
                description={activeRole === "MODEL_3D"
                    ? "Yalnız GLB kabul edilir. Buffer ve texture verileri dosyanın içinde olmalıdır; parametrik modeller ceyhunlarModel3d v1 bilgisini GLB extras alanında taşımalıdır."
                    : undefined}
            />

            <UploadQueue uploads={uploads} />

        </div>

    )

}
