"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export default function ProductActiveFilters({ basePath = "/urunler/filtre" }: { basePath?: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const entries = Array.from(searchParams.entries()).filter(
        ([key]) => key !== "page" && key !== "limit"
    )

    if (entries.length === 0) return null

    function removeFilter(key: string, value?: string) {
        const params = new URLSearchParams(searchParams.toString())

        if (!value) {
            params.delete(key)
        } else {
            const values = params.get(key)?.split(",") ?? []
            const next = values.filter((v) => v !== value)

            if (next.length === 0) {
                params.delete(key)
            } else {
                params.set(key, next.join(","))
            }
        }

        router.replace(`${basePath}?${params.toString()}`)
    }

    return (
        <div className="flex flex-wrap gap-2">
            {entries.map(([key, value]) => {

                const values = value.split(",")

                return values.map((v) => (
                    <Badge
                        key={`${key}-${v}`}
                        className="flex items-center gap-1 cursor-pointer"
                        onClick={() => removeFilter(key, v)}
                    >
                        {v}
                        <X className="w-3 h-3" />
                    </Badge>
                ))
            })}
        </div>
    )
}
