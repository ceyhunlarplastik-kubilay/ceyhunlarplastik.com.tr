"use client"

import { Progress } from "@/components/ui/progress"

type Props = {
    name: string
    progress: number
}

export function UploadItem({ name, progress }: Props) {

    return (
        <div className="space-y-1">

            <div className="text-sm">{name}</div>

            <Progress value={progress} />

        </div>
    )
}