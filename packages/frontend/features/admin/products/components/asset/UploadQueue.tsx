"use client"

import { UploadItem } from "@/features/admin/products/components/asset/UploadItem"

type Upload = {
    id: string
    file: File
    progress: number
}

type Props = {
    uploads: Upload[]
}

export function UploadQueue({ uploads }: Props) {

    if (uploads.length === 0) return null
    return (
        <div className="space-y-3">
            {uploads.map(upload => (
                <UploadItem
                    key={upload.id}
                    name={upload.file.name}
                    progress={upload.progress}
                />
            ))}
        </div>
    )
}
