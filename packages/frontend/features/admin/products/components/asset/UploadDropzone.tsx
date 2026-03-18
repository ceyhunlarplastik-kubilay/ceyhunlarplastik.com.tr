"use client"

import { useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { UploadCloud } from "lucide-react"

type Props = {
    onFiles: (files: File[]) => void
}

export function UploadDropzone({ onFiles }: Props) {

    const onDrop = useCallback((acceptedFiles: File[]) => {

        onFiles(acceptedFiles)

    }, [onFiles])

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop
    })

    return (
        <div
            {...getRootProps()}
            className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-neutral-50"
        >
            <input {...getInputProps()} />
            <UploadCloud className="mx-auto mb-2 text-neutral-400" />
            {isDragActive
                ? <p>Dosyaları bırak...</p>
                : <p>Dosyaları sürükle veya tıkla</p>
            }
        </div>
    )
}
