"use client"

import { UploadItem } from "./UploadItem"

type Upload = {
    id: string
    file: File
    progress: number
}

type Props = {
    uploads: Upload[]
}

export function UploadQueue({ uploads }: Props) {

    if (!uploads.length) return null

    return (
        <div className="space-y-3">

            {uploads.map((u) => (

                <UploadItem
                    key={u.id}
                    name={u.file.name}
                    progress={u.progress}
                />

            ))}

        </div>
    )
}