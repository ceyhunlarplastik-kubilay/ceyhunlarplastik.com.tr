import Link from "next/link"
import { ArrowLeft, Database, Fingerprint, ShieldCheck } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { EditProductAttributeMetadataCard } from "@/features/admin/productAttributes/components/EditProductAttributeMetadataCard"
import { ProductAttributeDetailStats } from "@/features/admin/productAttributes/components/ProductAttributeDetailStats"
import { ProductAttributeValuesManager } from "@/features/admin/productAttributes/components/ProductAttributeValuesManager"
import { isSystemCustomerAttributeCode } from "@/features/admin/productAttributes/constants"
import type { ProductAttribute } from "@/features/admin/productAttributes/types"

type Props = {
    attribute: ProductAttribute
    backHref?: string
    workspaceLabel?: string
}

export function ProductAttributeDetailPage({
    attribute,
    backHref = "/admin/productAttributes",
    workspaceLabel = "Ürün Özellikleri",
}: Props) {
    const isSystemCustomerAttribute = isSystemCustomerAttributeCode(attribute.code)
    const isCustomerAssignable = isSystemCustomerAttribute || Boolean(attribute.isCustomerAssignable)

    return (
        <div className="space-y-6">
            <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-sm">
                <div className="relative bg-gradient-to-br from-neutral-50 via-white to-amber-50 px-5 py-6 sm:px-6 lg:px-7">
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-brand/30 to-transparent" />
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div className="min-w-0">
                            <Button asChild variant="ghost" className="-ml-3 mb-4 gap-2 text-neutral-600 hover:text-neutral-950">
                                <Link href={backHref}>
                                    <ArrowLeft className="h-4 w-4" />
                                    Özelliklere Dön
                                </Link>
                            </Button>

                            <div className="flex flex-wrap items-center gap-2">
                                <Badge variant="outline" className="border-brand/20 bg-white/80 text-brand shadow-sm">
                                    <Database className="h-3.5 w-3.5" />
                                    {workspaceLabel}
                                </Badge>
                                {isSystemCustomerAttribute ? (
                                    <Badge className="border border-amber-200 bg-amber-50 text-amber-800 shadow-sm hover:bg-amber-50">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Sistem profil alanı
                                    </Badge>
                                ) : null}
                            </div>

                            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-neutral-950 sm:text-4xl">
                                {attribute.name}
                            </h1>
                            <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-neutral-200 bg-white/80 px-3 py-1.5 font-mono text-xs text-neutral-600 shadow-sm">
                                <Fingerprint className="h-3.5 w-3.5 shrink-0 text-neutral-400" />
                                <span className="truncate">{attribute.code}</span>
                            </div>
                        </div>

                        <ProductAttributeDetailStats
                            attributeId={attribute.id}
                            isCustomerAssignable={isCustomerAssignable}
                        />
                    </div>
                </div>
            </div>

            <EditProductAttributeMetadataCard attribute={attribute} />

            <ProductAttributeValuesManager
                attributeId={attribute.id}
                attributeCode={attribute.code}
            />
        </div>
    )
}
