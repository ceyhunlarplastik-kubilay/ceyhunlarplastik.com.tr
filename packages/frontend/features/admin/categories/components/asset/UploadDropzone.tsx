"use client"

import { useDropzone } from "react-dropzone"
import { UploadCloud } from "lucide-react"

type Props = {
    onFiles: (files: File[]) => void
}

export function UploadDropzone({ onFiles }: Props) {

    const { getRootProps, getInputProps, isDragActive } =
        useDropzone({
            onDrop: onFiles,
            multiple: true
        })

    return (
        <div
            {...getRootProps()}
            className={`
        border-2 border-dashed rounded-xl p-10
        flex flex-col items-center justify-center
        cursor-pointer transition
        ${isDragActive
                    ? "border-black bg-neutral-100"
                    : "border-neutral-300"}
      `}
        >

            <input {...getInputProps()} />

            <UploadCloud className="h-8 w-8 mb-2 text-neutral-500" />

            <p className="text-sm text-muted-foreground">
                Drag & drop files here or click
            </p>

        </div>
    )
}