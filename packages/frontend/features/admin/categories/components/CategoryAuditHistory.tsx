"use client"

import { useMemo } from "react"

import { EntityAuditHistory } from "@/features/admin/auditLogs/components/EntityAuditHistory"
import { buildCategoryAuditPresenter } from "@/features/admin/categories/utils/categoryAuditPresentation"
import { useAttributesForFilter } from "@/features/admin/productAttributes/hooks/useAttributesForFilter"

type Props = {
    categoryId: string
}

/** Kategorinin değişiklik geçmişi (yalnız admin / owner — bkz. `canViewAuditLogs`). */
export function CategoryAuditHistory({ categoryId }: Props) {
    // İzinli attribute değerleri kayıtta id olarak durur; adları sözlükten çözülür.
    // Aynı dialog'daki `ProductAttributeSelect` ile aynı sorgu — önbellekten gelir.
    const { data: attributes } = useAttributesForFilter()
    const presenter = useMemo(() => buildCategoryAuditPresenter(attributes), [attributes])

    return <EntityAuditHistory entityType="Category" entityId={categoryId} presenter={presenter} />
}
