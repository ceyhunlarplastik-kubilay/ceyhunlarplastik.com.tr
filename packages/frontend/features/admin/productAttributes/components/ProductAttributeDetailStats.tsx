"use client"

import { ImageIcon, Layers3, UserRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { useQuery } from "@tanstack/react-query"
import { listProductAttributeValues } from "@/features/admin/productAttributes/api/productAttributeValueApi"
import { productAttributeKeys } from "@/features/admin/productAttributes/api/productAttributeKeys"

type Props = {
    attributeId: string
    isCustomerAssignable: boolean
}

export function ProductAttributeDetailStats({ attributeId, isCustomerAssignable }: Props) {
    const valuesQuery = useQuery({
        queryKey: productAttributeKeys.values(attributeId),
        queryFn: () => listProductAttributeValues(attributeId),
    })

    const values = valuesQuery.data ?? []
    const visualCount = values.filter((value) => (value.assets?.length ?? 0) > 0).length

    return (
        <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="border-neutral-200 bg-white/80 text-neutral-700 shadow-sm">
                <Layers3 className="h-3.5 w-3.5" />
                {valuesQuery.isLoading ? "Değerler yükleniyor" : `${values.length} değer`}
            </Badge>
            <Badge variant="outline" className="border-neutral-200 bg-white/80 text-neutral-700 shadow-sm">
                <ImageIcon className="h-3.5 w-3.5" />
                {valuesQuery.isLoading ? "Görseller yükleniyor" : `${visualCount} görselli değer`}
            </Badge>
            {isCustomerAssignable ? (
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 shadow-sm hover:bg-emerald-50">
                    <UserRound className="h-3.5 w-3.5" />
                    Müşteri profilinde kullanılır
                </Badge>
            ) : (
                <Badge variant="outline" className="border-neutral-200 bg-white/80 text-neutral-600 shadow-sm">
                    Müşteri profiline kapalı
                </Badge>
            )}
        </div>
    )
}
